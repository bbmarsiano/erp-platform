import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, jsonResponse, requireAdmin } from '../_shared/admin.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await req.json().catch(() => null)
  const licenseId = body?.licenseId
  if (!licenseId || typeof licenseId !== 'string') {
    return jsonResponse({ error: 'licenseId is required' }, 400)
  }

  const allowed = [
    'is_active',
    'allowed_version',
    'features',
    'max_users',
    'max_installs',
    'expires_at',
    'billing_type',
    'price_paid',
    'currency',
    'notes',
    'product'
  ] as const

  const updates: Record<string, unknown> = {}
  for (const field of allowed) {
    if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  if (!Object.keys(updates).length) {
    return jsonResponse({ error: 'No updatable fields provided' }, 400)
  }

  const { data, error } = await auth.admin
    .from('license_keys')
    .update(updates)
    .eq('id', licenseId)
    .select('*, tenant:tenants(*)')
    .single()

  if (error) return jsonResponse({ error: error.message }, 500)
  return jsonResponse({ license: data })
})
