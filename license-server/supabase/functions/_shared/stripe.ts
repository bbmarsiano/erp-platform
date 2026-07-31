import Stripe from 'https://esm.sh/stripe@17?target=deno'

export const STRIPE_BILLING_TYPES = ['monthly', 'annual', 'lifetime'] as const
export type StripeBillingType = (typeof STRIPE_BILLING_TYPES)[number]

/** Maps our billing_type values to Stripe Price lookup-key suffixes. */
export const STRIPE_BILLING_SUFFIX: Record<StripeBillingType, string> = {
  monthly: 'month',
  annual: 'yearly',
  lifetime: 'perpetual',
}

export function stripeLookupKey(productCode: string, billingType: StripeBillingType): string {
  return `${productCode}_${STRIPE_BILLING_SUFFIX[billingType]}`
}

export function createStripeClient(): Stripe {
  const secretKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not configured')
  return new Stripe(secretKey, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient(),
  })
}

export function isStripeTestMode(): boolean {
  const secretKey = Deno.env.get('STRIPE_SECRET_KEY') || ''
  return secretKey.startsWith('sk_test_')
}
