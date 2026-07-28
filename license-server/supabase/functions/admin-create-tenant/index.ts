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
  const name = body?.name?.trim()
  const email = body?.email?.trim()?.toLowerCase()
  if (!name || !email) {
    return jsonResponse({ error: 'name and email are required' }, 400)
  }

  const { data, error } = await auth.admin
    .from('tenants')
    .insert({
      name,
      email,
      company: body?.company ?? '',
      plan: body?.plan ?? 'standard',
      notes: body?.notes ?? '',
      is_active: true
    })
    .select('*')
    .single()

  if (error) return jsonResponse({ error: error.message }, 500)
  return jsonResponse({ tenant: data })
})
