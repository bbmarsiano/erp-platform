import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_KEY
)

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
  features: string[]
  max_users: number
  expires_at: string
  is_active: boolean
  last_validated_at: string | null
  install_count: number
  allowed_version: string | null
  billing_type?: 'annual' | 'lifetime'
  price_paid?: number | null
  currency?: string | null
  max_installs?: number
  created_at: string
  tenant?: Tenant
}

