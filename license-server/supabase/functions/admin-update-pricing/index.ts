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
  if (!body?.config) {
    return jsonResponse({ error: 'config is required' }, 400)
  }

  const { data, error } = await auth.admin
    .from('pricing_config')
    .upsert({
      id: 'default',
      config: body.config,
      updated_at: new Date().toISOString()
    })
    .select('config')
    .single()

  if (error) return jsonResponse({ error: error.message }, 500)
  return jsonResponse({ config: data?.config ?? body.config })
})
