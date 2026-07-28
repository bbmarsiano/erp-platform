import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const { key } = await req.json()
    if (!key || typeof key !== 'string') {
      return new Response(
        JSON.stringify({ valid: false, error: 'License key required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!)['default']
    )
    const { data: license, error } = await supabase
      .from('license_keys')
      .select('*, tenant:tenants(*)')
      .eq('key', key.trim().toUpperCase())
      .single()

    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const ua = req.headers.get('user-agent') || 'unknown'

    if (error || !license) {
      await supabase.from('validation_log').insert({
        license_key: key, ip_address: ip, user_agent: ua,
        result: 'invalid', reason: 'Key not found'
      })
      return new Response(
        JSON.stringify({ valid: false, error: 'License key not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (!license.is_active || !license.tenant.is_active) {
      await supabase.from('validation_log').insert({
        license_key: key, ip_address: ip, user_agent: ua,
        result: 'invalid', reason: 'Inactive'
      })
      return new Response(
        JSON.stringify({ valid: false, error: 'License is inactive' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const isLifetime = license.billing_type === 'lifetime'
    const isTrial = license.billing_type === 'trial'

    if (!isLifetime && new Date(license.expires_at) < new Date()) {
      await supabase.from('validation_log').insert({
        license_key: key, ip_address: ip, user_agent: ua,
        result: 'expired', reason: 'Expired'
      })
      return new Response(
        JSON.stringify({ valid: false, error: 'License has expired' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    await supabase.from('license_keys').update({
      last_validated_at: new Date().toISOString(),
      install_count: license.install_count + 1
    }).eq('id', license.id)

    await supabase.from('validation_log').insert({
      license_key: key, ip_address: ip, user_agent: ua, result: 'valid'
    })

    const daysRemaining = isLifetime
      ? 99999
      : Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    return new Response(
      JSON.stringify({
        valid: daysRemaining > 0 || isLifetime,
        features: license.features,
        expiresAt: isLifetime ? null : license.expires_at,
        tenant: license.tenant.name,
        maxUsers: license.max_users,
        plan: license.tenant.plan,
        billingType: license.billing_type ?? 'annual',
        isTrial,
        isLifetime,
        daysRemaining,
        allowedVersion: license.allowed_version ?? null,
        product: license.product ?? 'erp'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch {
    return new Response(
      JSON.stringify({ valid: false, error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

