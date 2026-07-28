import { createClient, type Session, type User } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY')
}

export const supabase = createClient(url ?? '', publishableKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

export interface Tenant {
  id: string
  name: string
  email: string
  company: string
  plan: string
  is_active: boolean
  notes: string
  created_at: string
}

export interface LicenseKey {
  id: string
  tenant_id: string
  key: string
  product?: 'erp' | 'crm' | string
  features: string[]
  max_users: number
  expires_at: string
  is_active: boolean
  last_validated_at: string | null
  install_count: number
  allowed_version: string | null
  billing_type?: 'annual' | 'lifetime' | 'trial'
  price_paid?: number | null
  currency?: string | null
  max_installs?: number
  created_at: string
  tenant?: Tenant
}

async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.access_token) {
    throw new Error('Not authenticated')
  }
  return data.session.access_token
}

export async function invokeAdmin<T = unknown>(
  functionName: string,
  body?: Record<string, unknown>
): Promise<T> {
  const token = await getAccessToken()
  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (error) {
    let message = error.message
    try {
      const ctx = (error as { context?: Response }).context
      if (ctx) {
        const payload = await ctx.json()
        if (payload?.error) message = payload.error
      }
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data as T
}

export type { Session, User }
