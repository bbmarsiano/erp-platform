import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

function generateKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `TRIAL-${segment()}-${segment()}-${segment()}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, company } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!)['default']
    )

    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('email', email)
      .single()

    if (existingTenant) {
      const { data: existingLicense } = await supabase
        .from('license_keys')
        .select('key')
        .eq('tenant_id', existingTenant.id)
        .eq('billing_type', 'trial')
        .single()

      if (existingLicense) {
        await sendTrialEmail(email, name, existingLicense.key)
        return new Response(JSON.stringify({ success: true, message: 'Trial key resent' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: company || name || email.split('@')[0],
        email,
        company: company || null,
        plan: 'trial',
        is_active: true
      })
      .select()
      .single()

    if (tenantError) throw tenantError

    const key = generateKey()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 14)

    const { error: licenseError } = await supabase.from('license_keys').insert({
      tenant_id: tenant.id,
      key,
      features: ['module:wms', 'module:scm', 'module:mes', 'module:pos', 'module:backup'],
      max_users: 10,
      max_installs: 1,
      expires_at: expiresAt.toISOString(),
      billing_type: 'trial',
      is_active: true,
      notes: `Trial generated for ${email}`
    })

    if (licenseError) throw licenseError

    await sendTrialEmail(email, name || email.split('@')[0], key)

    return new Response(JSON.stringify({ success: true, message: 'Trial key sent to email' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error: unknown) {
    console.error('Error:', error)
    let message = 'Internal error'
    if (error instanceof Error) {
      message = error.message
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String((error as { message: unknown }).message)
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function sendTrialEmail(email: string, name: string, key: string) {
  const resendKey = Deno.env.get('RESEND_API_KEY')!

  const html = `
<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DFlowERP Trial</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f3ff;
      padding: 40px 16px;
      -webkit-font-smoothing: antialiased;
    }
    .wrap {
      max-width: 540px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      overflow: hidden;
    }
    .header {
      padding: 28px 40px;
      border-bottom: 1px solid #f3f4f6;
    }
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
    }
    .logo-mark {
      width: 28px;
      height: 28px;
      background: #7c3aed;
      border-radius: 7px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 800;
      color: white;
      line-height: 1;
    }
    .logo-text {
      font-size: 15px;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.3px;
    }
    .body {
      padding: 36px 40px;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #7c3aed;
      background: #f5f3ff;
      padding: 4px 10px;
      border-radius: 20px;
      margin-bottom: 20px;
    }
    .greeting {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.4px;
      margin-bottom: 10px;
    }
    .intro {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.7;
      margin-bottom: 28px;
    }
    .intro strong {
      color: #111827;
      font-weight: 600;
    }
    .key-box {
      background: #fafafa;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 22px 24px;
      margin-bottom: 28px;
      text-align: center;
    }
    .key-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #9ca3af;
      margin-bottom: 10px;
    }
    .key-value {
      font-family: 'SF Mono', 'Fira Code', 'Fira Mono', monospace;
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      letter-spacing: 0.08em;
    }
    .key-note {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 8px;
    }
    .divider {
      height: 1px;
      background: #f3f4f6;
      margin: 28px 0;
    }
    .steps-title {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 16px;
    }
    .step {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .step:last-child { margin-bottom: 0; }
    .step-num {
      width: 20px;
      height: 20px;
      min-width: 20px;
      background: #7c3aed;
      border-radius: 50%;
      font-size: 10px;
      font-weight: 700;
      color: white;
      text-align: center;
      line-height: 20px;
      margin-top: 1px;
    }
    .step-text {
      font-size: 13px;
      color: #4b5563;
      line-height: 1.6;
    }
    .step-text a {
      color: #7c3aed;
      text-decoration: none;
    }
    .btn {
      display: block;
      background: #7c3aed;
      color: #ffffff !important;
      text-decoration: none;
      text-align: center;
      padding: 13px 24px;
      border-radius: 9px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 28px;
      letter-spacing: -0.1px;
    }
    .help {
      font-size: 13px;
      color: #9ca3af;
      line-height: 1.6;
      margin-top: 20px;
      text-align: center;
    }
    .help a {
      color: #7c3aed;
      text-decoration: none;
    }
    .footer {
      padding: 18px 40px;
      background: #fafafa;
      border-top: 1px solid #f3f4f6;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.6;
    }
    .footer a {
      color: #9ca3af;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrap">

    <div class="header">
      <span class="logo">
        <span class="logo-mark">D</span>
        <span class="logo-text">DFlowERP</span>
      </span>
    </div>

    <div class="body">
      <div class="badge">14-дневен безплатен trial</div>
      <div class="greeting">Здравейте, ${name}!</div>
      <p class="intro">
        Вашият trial лиценз е готов. Имате <strong>14 дни пълен достъп</strong>
        до всички модули — WMS, SCM, MES, POS и Backup —
        без ограничения и без кредитна карта.
      </p>

      <div class="key-box">
        <div class="key-label">Лицензен ключ</div>
        <div class="key-value">${key}</div>
        <div class="key-note">Валиден 14 дни от активацията</div>
      </div>

      <div class="divider"></div>

      <div class="steps-title">Как да започнете</div>

      <div class="step">
        <div class="step-num">1</div>
        <div class="step-text">
          Свалете installer от
          <a href="https://dflowhub.com/download">dflowhub.com/download</a>
        </div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-text">Стартирайте installer и въведете лицензния ключ</div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-text">Попълнете данните на фирмата и задайте администраторска парола</div>
      </div>
      <div class="step">
        <div class="step-num">4</div>
        <div class="step-text">
          Отворете браузър на
          <a href="http://localhost:3001">localhost:3001</a>
          и влезте в системата
        </div>
      </div>

      <a href="https://dflowhub.com/download" class="btn" style="color:#ffffff !important;text-decoration:none;">Свали DFlowERP</a>

      <p class="help">
        Въпроси? Разгледайте
        <a href="https://dflowhub.com/docs">документацията</a>
        или пишете на
        <a href="mailto:support@dflowhub.com">support@dflowhub.com</a>
      </p>
    </div>

    <div class="footer">
      © 2025 DFlowERP &nbsp;·&nbsp;
      <a href="https://dflowhub.com">dflowhub.com</a><br>
      Получавате този имейл защото поискахте безплатен trial.
    </div>

  </div>
</body>
</html>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'DFlowERP <onboarding@resend.dev>',
      to: [email],
      subject: 'Вашият DFlowERP trial лиценз е готов',
      html
    })
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend API error: ${res.status} ${body}`)
  }
}
