export interface PricingConfig {
  currency: string
  annual: {
    base: number
    users_11_25: number
    users_26_50: number
    users_51_plus: number
  }
  lifetime: {
    base: number
    users_11_25: number
    users_26_50: number
    users_51_plus: number
  }
  grace_period_days: number
  grace_period_readonly: boolean
}

export function calculateLicensePrice(
  pricing: PricingConfig,
  billingType: 'annual' | 'lifetime',
  maxUsers: number
) {
  const p = billingType === 'annual' ? pricing.annual : pricing.lifetime
  const suffix = billingType === 'annual' ? '/год' : ' еднократно'

  let usersExtra = 0
  if (maxUsers > 50) usersExtra = p.users_51_plus
  else if (maxUsers > 25) usersExtra = p.users_26_50
  else if (maxUsers > 10) usersExtra = p.users_11_25

  const base = p.base
  const total = base + usersExtra

  return {
    base,
    usersExtra,
    total,
    suffix,
    currency: pricing.currency
  }
}
