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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
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
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Inter, system-ui, sans-serif; background: #f6f8fa;
          margin: 0; padding: 40px 20px; }
        .container { max-width: 560px; margin: 0 auto; background: white;
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #7c3aed, #4f46e5);
          padding: 32px; text-align: center; }
        .logo { font-size: 24px; font-weight: 900; color: white;
          letter-spacing: -0.5px; }
        .tagline { font-size: 13px; color: rgba(255,255,255,0.7);
          margin-top: 4px; }
        .body { padding: 32px; }
        .greeting { font-size: 18px; font-weight: 700; color: #0f172a;
          margin-bottom: 12px; }
        .text { font-size: 14px; color: #6b7280; line-height: 1.7;
          margin-bottom: 16px; }
        .key-box { background: #f5f3ff; border: 2px dashed #7c3aed;
          border-radius: 12px; padding: 20px; text-align: center;
          margin: 24px 0; }
        .key-label { font-size: 12px; font-weight: 600; color: #7c3aed;
          text-transform: uppercase; letter-spacing: 0.1em;
          margin-bottom: 8px; }
        .key { font-size: 22px; font-weight: 900; color: #4c1d95;
          font-family: monospace; letter-spacing: 0.1em; }
        .key-note { font-size: 11px; color: #9ca3af; margin-top: 8px; }
        .steps { background: #f8fafc; border-radius: 10px; padding: 20px;
          margin: 20px 0; }
        .steps-title { font-size: 13px; font-weight: 700; color: #374151;
          margin-bottom: 12px; }
        .step { display: flex; gap: 10px; margin-bottom: 10px;
          font-size: 13px; color: #374151; }
        .step-num { width: 22px; height: 22px; background: #7c3aed;
          color: white; border-radius: 50%; display: flex;
          align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; flex-shrink: 0; }
        .btn { display: block; background: #7c3aed; color: white;
          text-decoration: none; text-align: center; padding: 14px 24px;
          border-radius: 10px; font-weight: 700; font-size: 14px;
          margin: 24px 0; }
        .trial-badge { display: inline-block; background: #dcfce7;
          color: #166534; padding: 4px 12px; border-radius: 20px;
          font-size: 12px; font-weight: 700; margin-bottom: 16px; }
        .footer { padding: 20px 32px; background: #f8fafc;
          border-top: 1px solid #e5e7eb; text-align: center;
          font-size: 11px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">⚡ DFlowERP</div>
          <div class="tagline">ERP за вашия бизнес</div>
        </div>
        <div class="body">
          <div class="trial-badge">✅ 14-дневен безплатен trial</div>
          <div class="greeting">Здравейте, ${name}!</div>
          <p class="text">
            Вашият безплатен trial лиценз за DFlowERP е готов.
            Имате <strong>14 дни пълен достъп</strong> до всички модули —
            без ограничения, без кредитна карта.
          </p>

          <div class="key-box">
            <div class="key-label">Вашият лицензен ключ</div>
            <div class="key">${key}</div>
            <div class="key-note">Валиден 14 дни от активацията</div>
          </div>

          <div class="steps">
            <div class="steps-title">Как да започнете:</div>
            <div class="step">
              <div class="step-num">1</div>
              <div>Свалете installer за вашата платформа от
                <a href="https://dflowhub.com/download">dflowhub.com/download</a>
              </div>
            </div>
            <div class="step">
              <div class="step-num">2</div>
              <div>Стартирайте installer и въведете лицензния ключ по-горе</div>
            </div>
            <div class="step">
              <div class="step-num">3</div>
              <div>Попълнете данните на фирмата и задайте администраторска парола</div>
            </div>
            <div class="step">
              <div class="step-num">4</div>
              <div>Отворете браузър на <strong>http://localhost:3001</strong>
                и влезте в системата</div>
            </div>
          </div>

          <a href="https://dflowhub.com/download" class="btn">
            ⬇️ Свали DFlowERP
          </a>

          <p class="text">
            Нуждаете се от помощ? Разгледайте
            <a href="https://dflowhub.com/docs">документацията</a>
            или се свържете с нас на
            <a href="mailto:support@dflowhub.com">support@dflowhub.com</a>
          </p>
        </div>
        <div class="footer">
          © 2025 DFlowERP · <a href="https://dflowhub.com">dflowhub.com</a>
          <br>Получавате този имейл защото поискахте безплатен trial.
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
      from: 'DFlowERP <noreply@dflowhub.com>',
      to: [email],
      subject: '⚡ Вашият DFlowERP trial лиценз е готов',
      html
    })
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend API error: ${res.status} ${body}`)
  }
}
