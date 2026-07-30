import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STRIPE_BILLING_SUFFIX: Record<string, string> = {
  monthly: 'month',
  annual: 'yearly',
  lifetime: 'perpetual',
}

const ALLOWED_BILLING = new Set(['monthly', 'annual', 'lifetime'])

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { product, billingType, email, tenantName } = body as Record<string, unknown>

    if (!product || typeof product !== 'string' || !product.trim()) {
      return new Response(JSON.stringify({ error: 'product is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!billingType || typeof billingType !== 'string' || !ALLOWED_BILLING.has(billingType)) {
      return new Response(
        JSON.stringify({ error: "billingType must be one of: 'monthly', 'annual', 'lifetime'" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return new Response(JSON.stringify({ error: 'email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!tenantName || typeof tenantName !== 'string' || !tenantName.trim()) {
      return new Response(JSON.stringify({ error: 'tenantName is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const productCode = product.trim()
    const billing = billingType as 'monthly' | 'annual' | 'lifetime'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!)['default'],
    )

    const { data: productRow, error: productError } = await supabase
      .from('products')
      .select('code, is_active')
      .eq('code', productCode)
      .maybeSingle()

    if (productError) {
      return new Response(JSON.stringify({ error: 'Failed to validate product' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!productRow || !productRow.is_active) {
      return new Response(JSON.stringify({ error: `Unknown or inactive product: ${productCode}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const secretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!secretKey) {
      return new Response(JSON.stringify({ error: 'Stripe is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const suffix = STRIPE_BILLING_SUFFIX[billing]
    const lookupKey = `${productCode}_${suffix}`

    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      active: true,
      limit: 1,
    })

    const price = prices.data[0]
    if (!price) {
      return new Response(
        JSON.stringify({ error: `No active Stripe price found for lookup key: ${lookupKey}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const successUrl =
      Deno.env.get('CHECKOUT_SUCCESS_URL') ||
      'https://dflowhub-landing.vercel.app/checkout/success?session_id={CHECKOUT_SESSION_ID}'
    const cancelUrl =
      Deno.env.get('CHECKOUT_CANCEL_URL') || 'https://dflowhub-landing.vercel.app/checkout/cancel'

    const session = await stripe.checkout.sessions.create({
      mode: billing === 'lifetime' ? 'payment' : 'subscription',
      line_items: [{ price: price.id, quantity: 1 }],
      customer_email: email.trim(),
      metadata: {
        product: productCode,
        billingType: billing,
        tenantName: tenantName.trim(),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout session creation failed'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
