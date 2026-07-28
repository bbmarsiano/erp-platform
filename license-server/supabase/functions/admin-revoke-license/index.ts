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

  const { data, error } = await auth.admin
    .from('license_keys')
    .update({ is_active: false })
    .eq('id', licenseId)
    .select('id, is_active')
    .single()

  if (error) return jsonResponse({ error: error.message }, 500)
  return jsonResponse({ license: data })
})
