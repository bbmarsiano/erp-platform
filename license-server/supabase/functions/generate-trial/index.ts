import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { defaultFeaturesForProduct } from '../_shared/license.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

/** Short labels for email module lists (derived from license features). */
const FEATURE_LABELS: Record<string, string> = {
  'module:wms': 'WMS',
  'module:scm': 'SCM',
  'module:mes': 'MES',
  'module:pos': 'POS',
  'module:backup': 'Backup',
  'module:finance': 'Finance',
  'module:sales': 'Sales',
  'module:service': 'Service',
  'module:analytics': 'Analytics',
  'module:marketing': 'Marketing',
  'module:integrations': 'Integrations'
}

function generateKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `TRIAL-${segment()}-${segment()}-${segment()}`
}

function formatModulesList(features: string[]): string {
  const labels = features.map((f) => FEATURE_LABELS[f] ?? f.replace(/^module:/, ''))
  if (labels.length === 0) return ''
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} и ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')} и ${labels[labels.length - 1]}`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { email, name, company } = body ?? {}
    const productCode =
      typeof body?.product === 'string' && body.product.trim()
        ? body.product.trim()
        : 'erp'

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

    const { data: productRow, error: productError } = await supabase
      .from('products')
      .select('code, name, is_active')
      .eq('code', productCode)
      .maybeSingle()

    if (productError) {
      return new Response(JSON.stringify({ error: 'Failed to validate product' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (!productRow || !productRow.is_active) {
      return new Response(
        JSON.stringify({ error: `Unknown or inactive product: ${productCode}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const features = defaultFeaturesForProduct(productCode)
    if (!features.length) {
      return new Response(
        JSON.stringify({ error: `No default features for product: ${productCode}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const displayName = productRow.name
    const recipientName = name || email.split('@')[0]

    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingTenant) {
      const { data: existingLicense } = await supabase
        .from('license_keys')
        .select('key, features, product')
        .eq('tenant_id', existingTenant.id)
        .eq('billing_type', 'trial')
        .eq('product', productCode)
        .maybeSingle()

      if (existingLicense) {
        await sendTrialEmail({
          email,
          name: recipientName,
          key: existingLicense.key,
          productName: displayName,
          features: Array.isArray(existingLicense.features) ? existingLicense.features : features
        })
        return new Response(JSON.stringify({ success: true, message: 'Trial key resent' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    let tenantId = existingTenant?.id
    if (!tenantId) {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: company || name || email.split('@')[0],
          email,
          company: company || null,
          plan: 'trial',
          is_active: true
        })
        .select('id')
        .single()

      if (tenantError) throw tenantError
      tenantId = tenant.id
    }

    const key = generateKey()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 14)

    const { error: licenseError } = await supabase.from('license_keys').insert({
      tenant_id: tenantId,
      key,
      product: productCode,
      features,
      max_users: 10,
      max_installs: 1,
      expires_at: expiresAt.toISOString(),
      billing_type: 'trial',
      is_active: true,
      notes: `Trial generated for ${email} (${productCode})`
    })

    if (licenseError) throw licenseError

    await sendTrialEmail({
      email,
      name: recipientName,
      key,
      productName: displayName,
      features
    })

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

async function sendTrialEmail(opts: {
  email: string
  name: string
  key: string
  productName: string
  features: string[]
}) {
  const resendKey = Deno.env.get('RESEND_API_KEY')!
  const productName = opts.productName
  const modulesList = formatModulesList(opts.features)
  const safeName = escapeHtml(opts.name)
  const safeProduct = escapeHtml(productName)
  const safeKey = escapeHtml(opts.key)
  const safeModules = escapeHtml(modulesList)
  const logoMark = escapeHtml(productName.charAt(0) || 'D')

  const html = `
<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeProduct} Trial</title>
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
        <span class="logo-mark">${logoMark}</span>
        <span class="logo-text">${safeProduct}</span>
      </span>
    </div>

    <div class="body">
      <div class="badge">14-дневен безплатен trial</div>
      <div class="greeting">Здравейте, ${safeName}!</div>
      <p class="intro">
        Вашият trial лиценз за <strong>${safeProduct}</strong> е готов. Имате <strong>14 дни пълен достъп</strong>
        до всички модули — ${safeModules} —
        без ограничения и без кредитна карта.
      </p>

      <div class="key-box">
        <div class="key-label">Лицензен ключ</div>
        <div class="key-value">${safeKey}</div>
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

      <a href="https://dflowhub.com/download" class="btn" style="color:#ffffff !important;text-decoration:none;">Свали ${safeProduct}</a>

      <p class="help">
        Въпроси? Разгледайте
        <a href="https://dflowhub.com/docs">документацията</a>
        или пишете на
        <a href="mailto:support@dflowhub.com">support@dflowhub.com</a>
      </p>
    </div>

    <div class="footer">
      © 2025 ${safeProduct} &nbsp;·&nbsp;
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
      from: `${productName} <onboarding@resend.dev>`,
      to: [opts.email],
      subject: `Вашият ${productName} trial лиценз е готов`,
      html
    })
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend API error: ${res.status} ${text}`)
  }
}
