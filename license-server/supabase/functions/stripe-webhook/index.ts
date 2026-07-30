import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@17?target=deno'
import { createAdminClient } from '../_shared/admin.ts'
import {
  SELF_SERVE_MAX_INSTALLS,
  SELF_SERVE_MAX_USERS,
  computeExpiresAt,
  defaultFeaturesForProduct,
  findOrCreateTenant,
  generateLicenseKey,
} from '../_shared/license.ts'

const PRODUCT_NAMES: Record<string, string> = {
  erp: 'DFlowERP',
  crm: 'DFlowCRM',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200 })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const secretKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!secretKey || !webhookSecret) {
    return new Response(JSON.stringify({ error: 'Stripe is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient(),
  })

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    console.error('Webhook signature verification failed:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      default:
        // Acknowledge unhandled events so Stripe does not retry
        break
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Handler failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const admin = createAdminClient()
  const sessionId = session.id

  const { data: existing } = await admin
    .from('license_keys')
    .select('id, key')
    .eq('stripe_checkout_session_id', sessionId)
    .maybeSingle()

  if (existing) {
    console.log(`Idempotent skip: license already exists for checkout session ${sessionId}`)
    return
  }

  const product = session.metadata?.product?.trim()
  const billingType = session.metadata?.billingType?.trim()
  const tenantName = session.metadata?.tenantName?.trim()
  const email =
    session.customer_details?.email?.trim() ||
    session.customer_email?.trim() ||
    null

  if (!product || !billingType || !tenantName) {
    throw new Error(`checkout.session.completed missing metadata for ${sessionId}`)
  }
  if (!['monthly', 'annual', 'lifetime'].includes(billingType)) {
    throw new Error(`Unsupported billingType in metadata: ${billingType}`)
  }

  const features = defaultFeaturesForProduct(product)
  if (!features.length) {
    throw new Error(`No default features for product: ${product}`)
  }

  const stripeCustomerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer && !session.customer.deleted
        ? session.customer.id
        : null

  const tenant = await findOrCreateTenant(admin, {
    tenantName,
    email,
    company: tenantName,
    stripeCustomerId,
  })
  if ('error' in tenant) {
    throw new Error(`Tenant resolve failed: ${tenant.error}`)
  }

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id ?? null

  const key = generateLicenseKey()
  const expiresAt = computeExpiresAt(billingType)

  const { data: license, error } = await admin
    .from('license_keys')
    .insert({
      tenant_id: tenant.id,
      key,
      product,
      features,
      // Self-serve: all modules, effectively unlimited seats (see SELF_SERVE_MAX_USERS).
      max_users: SELF_SERVE_MAX_USERS,
      max_installs: SELF_SERVE_MAX_INSTALLS,
      expires_at: expiresAt,
      billing_type: billingType,
      is_active: true,
      stripe_subscription_id: subscriptionId,
      stripe_checkout_session_id: sessionId,
      notes: `Provisioned via Stripe Checkout ${sessionId}`,
    })
    .select('id, key')
    .single()

  if (error) {
    if (error.code === '23505') {
      console.log(`Idempotent race: license already inserted for session ${sessionId}`)
      return
    }
    throw new Error(`Failed to insert license: ${error.message}`)
  }

  try {
    await sendLicenseEmail({
      to: email,
      tenantName,
      product,
      billingType,
      key: license.key,
    })
  } catch (emailErr) {
    // Do not fail the webhook on email — Stripe would retry and we already have a license.
    console.error('License email failed (license still provisioned):', emailErr)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const admin = createAdminClient()
  const status = subscription.status
  const active = status === 'active' || status === 'trialing'
  const inactive = status === 'past_due' || status === 'unpaid' || status === 'canceled'

  if (!active && !inactive) {
    console.log(`Ignoring subscription status ${status} for ${subscription.id}`)
    return
  }

  const { error } = await admin
    .from('license_keys')
    .update({ is_active: active })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Failed to update license from subscription.updated:', error.message)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('license_keys')
    .update({ is_active: false })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Failed to deactivate license from subscription.deleted:', error.message)
  }
}

async function sendLicenseEmail(opts: {
  to: string | null
  tenantName: string
  product: string
  billingType: string
  key: string
}) {
  if (!opts.to) {
    console.warn('No customer email on session; skipping license email')
    return
  }

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    console.warn('RESEND_API_KEY not set; skipping license email')
    return
  }

  const productName = PRODUCT_NAMES[opts.product] ?? opts.product.toUpperCase()
  const subject = `Your ${productName} license key`

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <p>Hi ${escapeHtml(opts.tenantName)},</p>
  <p>Thanks for purchasing <strong>${escapeHtml(productName)}</strong> (${escapeHtml(opts.billingType)}).</p>
  <p>Your license key:</p>
  <p style="font-size: 20px; font-weight: 700; letter-spacing: 0.05em; font-family: ui-monospace, monospace;">
    ${escapeHtml(opts.key)}
  </p>
  <p>Enter this key during installation to activate your product.</p>
  <p>Need help getting started? Email <a href="mailto:sales@dflowhub.com">sales@dflowhub.com</a>.</p>
  <p>— DFlowHub</p>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'DFlowHub <onboarding@resend.dev>',
      to: [opts.to],
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend ${res.status}: ${text}`)
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
