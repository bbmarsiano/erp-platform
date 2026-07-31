import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, jsonResponse, requireAdmin } from '../_shared/admin.ts'
import {
  STRIPE_BILLING_TYPES,
  createStripeClient,
  isStripeTestMode,
  stripeLookupKey,
  type StripeBillingType,
} from '../_shared/stripe.ts'

type PricingRow = {
  productCode: string
  productName: string
  billingType: StripeBillingType
  amount: number | null
  currency: string | null
  stripePriceId: string | null
  lookupKey: string
  status: 'ok' | 'missing'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  try {
    const { data: products, error: productsError } = await auth.admin
      .from('products')
      .select('code, name')
      .eq('is_active', true)
      .order('code', { ascending: true })

    if (productsError) {
      return jsonResponse({ error: productsError.message }, 500)
    }

    const stripe = createStripeClient()
    const stripeTestMode = isStripeTestMode()
    const rows: PricingRow[] = []

    for (const product of products ?? []) {
      for (const billingType of STRIPE_BILLING_TYPES) {
        const lookupKey = stripeLookupKey(product.code, billingType)
        const prices = await stripe.prices.list({
          lookup_keys: [lookupKey],
          active: true,
          limit: 1,
        })
        const price = prices.data[0]

        if (!price) {
          rows.push({
            productCode: product.code,
            productName: product.name,
            billingType,
            amount: null,
            currency: null,
            stripePriceId: null,
            lookupKey,
            status: 'missing',
          })
          continue
        }

        rows.push({
          productCode: product.code,
          productName: product.name,
          billingType,
          amount: price.unit_amount,
          currency: price.currency,
          stripePriceId: price.id,
          lookupKey,
          status: 'ok',
        })
      }
    }

    return jsonResponse({ prices: rows, stripeTestMode })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list Stripe prices'
    return jsonResponse({ error: message }, 500)
  }
})
