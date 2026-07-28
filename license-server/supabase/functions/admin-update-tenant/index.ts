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
  const tenantId = body?.tenantId
  if (!tenantId || typeof tenantId !== 'string') {
    return jsonResponse({ error: 'tenantId is required' }, 400)
  }

  const updates: Record<string, unknown> = {}
  for (const field of ['name', 'email', 'company', 'plan', 'notes', 'is_active'] as const) {
    if (body[field] !== undefined) updates[field] = body[field]
  }
  if (!Object.keys(updates).length) {
    return jsonResponse({ error: 'No updatable fields provided' }, 400)
  }

  const { data, error } = await auth.admin
    .from('tenants')
    .update(updates)
    .eq('id', tenantId)
    .select('*')
    .single()

  if (error) return jsonResponse({ error: error.message }, 500)
  return jsonResponse({ tenant: data })
})
