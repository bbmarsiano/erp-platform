import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

/** Full-module sets matching admin GenerateLicense defaults. */
export const PRODUCT_DEFAULT_FEATURES: Record<string, string[]> = {
  erp: [
    'module:wms',
    'module:scm',
    'module:mes',
    'module:pos',
    'module:backup',
    'module:finance',
  ],
  crm: [
    'module:sales',
    'module:service',
    'module:analytics',
    'module:marketing',
    'module:integrations',
  ],
}

/**
 * Self-serve Stripe purchases use an effectively unlimited seat count
 * (no per-user tier yet). Raise/lower later when pricing introduces seats.
 */
export const SELF_SERVE_MAX_USERS = 9999
export const SELF_SERVE_MAX_INSTALLS = 3

export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const seg = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${seg()}-${seg()}-${seg()}-${seg()}`
}

export function defaultFeaturesForProduct(product: string): string[] {
  return PRODUCT_DEFAULT_FEATURES[product] ?? []
}

export function computeExpiresAt(billingType: string): string | null {
  const now = new Date()
  if (billingType === 'lifetime') return null
  if (billingType === 'monthly') {
    now.setUTCMonth(now.getUTCMonth() + 1)
    return now.toISOString()
  }
  if (billingType === 'annual') {
    now.setUTCFullYear(now.getUTCFullYear() + 1)
    return now.toISOString()
  }
  return null
}

export type FindOrCreateTenantInput = {
  tenantName: string
  email?: string | null
  company?: string | null
  stripeCustomerId?: string | null
}

/**
 * Match tenants by email (unique). Same logic as admin-create-license:
 * use provided email, or synthesize `{slug}@license.local` from the name.
 */
export async function findOrCreateTenant(
  admin: SupabaseClient,
  input: FindOrCreateTenantInput,
): Promise<{ id: string } | { error: string }> {
  const name = input.tenantName.trim()
  if (!name) return { error: 'tenantName is required' }

  const email =
    typeof input.email === 'string' && input.email.includes('@')
      ? input.email.trim().toLowerCase()
      : `${name.toLowerCase().replace(/\s+/g, '.')}@license.local`

  const { data: existing, error: lookupError } = await admin
    .from('tenants')
    .select('id, stripe_customer_id')
    .eq('email', email)
    .maybeSingle()

  if (lookupError) return { error: lookupError.message }

  if (existing?.id) {
    if (input.stripeCustomerId && !existing.stripe_customer_id) {
      await admin
        .from('tenants')
        .update({ stripe_customer_id: input.stripeCustomerId })
        .eq('id', existing.id)
    }
    return { id: existing.id }
  }

  const { data: created, error: tenantError } = await admin
    .from('tenants')
    .insert({
      name,
      email,
      company: input.company ?? name,
      plan: 'standard',
      is_active: true,
      stripe_customer_id: input.stripeCustomerId ?? null,
    })
    .select('id')
    .single()

  if (tenantError || !created) {
    return { error: tenantError?.message || 'Failed to create tenant' }
  }
  return { id: created.id }
}
