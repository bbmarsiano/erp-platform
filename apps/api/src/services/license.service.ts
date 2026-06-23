export interface LicenseResult {
  valid: boolean
  features: string[]
  allowedVersion: string | null
  expiresAt: string | null
  tenant: string | null
  maxUsers: number
  daysRemaining: number
  billingType?: string | null
  isLifetime?: boolean
  isTrial?: boolean
  plan?: string | null
}

export async function validateLicense(
  key: string,
  serverUrl: string,
  serverKey: string
): Promise<LicenseResult> {
  const response = await fetch(`${serverUrl}/functions/v1/validate-license`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serverKey}`
    },
    body: JSON.stringify({ key })
  })

  if (!response.ok) {
    throw new Error(`License server returned ${response.status}`)
  }

  const data = (await response.json()) as Partial<LicenseResult> & {
    valid?: boolean
    billingType?: string | null
    isLifetime?: boolean
    isTrial?: boolean
    plan?: string | null
  }
  return {
    valid: data.valid ?? false,
    features: data.features ?? [],
    allowedVersion: data.allowedVersion ?? null,
    expiresAt: data.expiresAt ?? null,
    tenant: data.tenant ?? null,
    maxUsers: data.maxUsers ?? 0,
    daysRemaining: data.daysRemaining ?? 0,
    billingType: data.billingType ?? null,
    isLifetime: data.isLifetime ?? data.billingType === 'lifetime',
    isTrial: data.isTrial ?? data.billingType === 'trial',
    plan: data.plan ?? null
  }
}
