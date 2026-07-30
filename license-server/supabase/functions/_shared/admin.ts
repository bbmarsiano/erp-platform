import { createClient, type SupabaseClient, type User } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

export function getSecretKey(): string {
  const raw = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (!raw) throw new Error('SUPABASE_SECRET_KEYS is not configured')
  const keys = JSON.parse(raw) as Record<string, string>
  const key = keys['default']
  if (!key) throw new Error('SUPABASE_SECRET_KEYS.default is missing')
  return key
}

export function createAdminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, getSecretKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}

export async function requireAdmin(
  req: Request
): Promise<{ admin: SupabaseClient; user: User } | Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing Authorization bearer token' }, 401)
  }

  const token = authHeader.slice(7).trim()
  if (!token) {
    return jsonResponse({ error: 'Invalid Authorization bearer token' }, 401)
  }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user?.email) {
    return jsonResponse({ error: 'Invalid or expired session' }, 401)
  }

  const allowlist = (Deno.env.get('ADMIN_EMAILS') || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  if (!allowlist.length) {
    return jsonResponse({ error: 'ADMIN_EMAILS is not configured' }, 500)
  }

  if (!allowlist.includes(data.user.email.toLowerCase())) {
    return jsonResponse({ error: 'Not authorized' }, 401)
  }

  return { admin, user: data.user }
}

export { generateLicenseKey } from './license.ts'
