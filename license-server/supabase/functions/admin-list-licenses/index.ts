import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, jsonResponse, requireAdmin } from '../_shared/admin.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { data, error } = await auth.admin
    .from('license_keys')
    .select('*, tenant:tenants(*)')
    .order('created_at', { ascending: false })

  if (error) return jsonResponse({ error: error.message }, 500)
  return jsonResponse({ licenses: data ?? [] })
})
