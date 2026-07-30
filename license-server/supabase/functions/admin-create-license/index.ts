import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  corsHeaders,
  generateLicenseKey,
  jsonResponse,
  requireAdmin
} from '../_shared/admin.ts'
import { findOrCreateTenant } from '../_shared/license.ts'

const KEY_FORMAT = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  try {
    const body = await req.json()
    const {
      tenantId,
      tenantName,
      tenantEmail,
      company,
      product = 'erp',
      billingType = 'annual',
      maxUsers = 10,
      maxInstalls = 3,
      features = [],
      expiresAt,
      customKey,
      pricePaid,
      currency = 'EUR'
    } = body ?? {}

    if (!Array.isArray(features) || features.length === 0) {
      return jsonResponse({ error: 'features are required' }, 400)
    }
    if (!['erp', 'crm'].includes(product)) {
      return jsonResponse({ error: 'product must be erp or crm' }, 400)
    }
    if (!['annual', 'lifetime', 'trial'].includes(billingType)) {
      return jsonResponse({ error: 'invalid billingType' }, 400)
    }

    let resolvedTenantId = tenantId as string | undefined

    if (!resolvedTenantId) {
      if (!tenantName || typeof tenantName !== 'string') {
        return jsonResponse({ error: 'tenantName or tenantId is required' }, 400)
      }
      const tenant = await findOrCreateTenant(auth.admin, {
        tenantName,
        email: typeof tenantEmail === 'string' ? tenantEmail : null,
        company: typeof company === 'string' ? company : null
      })
      if ('error' in tenant) {
        return jsonResponse({ error: tenant.error }, 500)
      }
      resolvedTenantId = tenant.id
    }

    let key: string
    if (customKey && typeof customKey === 'string' && customKey.trim()) {
      key = customKey.trim().toUpperCase()
      if (!KEY_FORMAT.test(key)) {
        return jsonResponse({ error: 'Invalid key format. Use XXXX-XXXX-XXXX-XXXX' }, 400)
      }
    } else {
      key = generateLicenseKey()
    }

    const finalExpiry =
      billingType === 'lifetime'
        ? new Date(Date.now() + 100 * 365.25 * 24 * 60 * 60 * 1000).toISOString()
        : expiresAt
          ? new Date(expiresAt).toISOString()
          : null

    if (!finalExpiry) {
      return jsonResponse({ error: 'expiresAt is required for non-lifetime licenses' }, 400)
    }

    const { data: license, error } = await auth.admin
      .from('license_keys')
      .insert({
        tenant_id: resolvedTenantId,
        key,
        product,
        features,
        max_users: Number(maxUsers) || 10,
        max_installs: Number(maxInstalls) || 3,
        expires_at: finalExpiry,
        billing_type: billingType,
        allowed_version: null,
        price_paid: pricePaid ?? null,
        currency,
        is_active: true
      })
      .select('*, tenant:tenants(*)')
      .single()

    if (error) {
      if (error.code === '23505') {
        return jsonResponse({ error: `Key ${key} already exists` }, 409)
      }
      return jsonResponse({ error: error.message }, 500)
    }

    return jsonResponse({ license, key })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Internal error' }, 500)
  }
})
