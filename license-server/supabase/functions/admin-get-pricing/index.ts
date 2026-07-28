import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, jsonResponse, requireAdmin } from '../_shared/admin.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { data, error } = await auth.admin
    .from('pricing_config')
    .select('config')
    .eq('id', 'default')
    .single()

  if (error) return jsonResponse({ error: error.message }, 500)
  return jsonResponse({ config: data?.config ?? null })
})
