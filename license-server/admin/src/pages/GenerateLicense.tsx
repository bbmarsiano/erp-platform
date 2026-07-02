import { FormEvent, useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import { supabase, Tenant } from '../lib/supabase'
import { calculateLicensePrice, type PricingConfig } from '../lib/pricing'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

function generateKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const seg = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${seg()}-${seg()}-${seg()}-${seg()}`
}

const lifetimeExpiryDate = () => {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 100)
  return d
}

const allModules = [
  { id: 'module:wms', label: '📦 WMS — Складово стопанство' },
  { id: 'module:scm', label: '🚚 SCM — Верига на доставките' },
  { id: 'module:mes', label: '🏭 MES — Производство' },
  { id: 'module:pos', label: '🛒 POS — Точка на продажба' },
  { id: 'module:backup', label: '💾 Backup — Архивиране' },
  { id: 'module:finance', label: '💰 Finance — Финансово-счетоводен модул' }
]

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1.5px solid #e5e7eb',
  borderRadius: 8,
  fontSize: 13,
  boxSizing: 'border-box',
  outline: 'none'
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6
}

export default function GenerateLicense() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantId, setTenantId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [maxUsers, setMaxUsers] = useState(10)
  const [billingType, setBillingType] = useState<'annual' | 'lifetime'>('annual')
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    allModules.map((m) => m.id)
  )
  const [generated, setGenerated] = useState('')
  const [pricing, setPricing] = useState<PricingConfig | null>(null)
  const [maxInstalls, setMaxInstalls] = useState(3)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('tenants').select('*').eq('is_active', true).order('name')
      const rows = (data as Tenant[]) ?? []
      setTenants(rows)
      if (rows[0]) setTenantId(rows[0].id)
    }
    void load()
  }, [])

  useEffect(() => {
    supabase
      .from('pricing_config')
      .select('config')
      .eq('id', 'default')
      .single()
      .then(({ data }) => {
        if (data) setPricing(data.config as PricingConfig)
      })
  }, [])

  const price = pricing ? calculateLicensePrice(pricing, billingType, maxUsers) : null

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const key = generateKey()
    const finalExpiry =
      billingType === 'lifetime'
        ? lifetimeExpiryDate().toISOString()
        : new Date(expiresAt).toISOString()

    await supabase.from('license_keys').insert({
      tenant_id: tenantId,
      key,
      features: selectedFeatures,
      max_users: maxUsers,
      expires_at: finalExpiry,
      billing_type: billingType,
      allowed_version: null,
      price_paid: price?.total ?? null,
      currency: price?.currency ?? 'EUR',
      max_installs: maxInstalls
    })
    setGenerated(key)
  }

  return (
    <div>
      <PageHeader
        title="Нов лиценз"
        subtitle="Генериране на нов лицензен ключ за клиент"
      />

      <Card style={{ maxWidth: 720 }}>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={labelStyle}>Клиент</label>
            <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} required style={{ ...fieldStyle, background: 'white' }}>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ ...labelStyle, marginBottom: 8 }}>Тип лиценз</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'annual', label: '📅 Годишен (SaaS)', desc: 'Срочен с контролирани updates' },
                { id: 'lifetime', label: '♾️ Lifetime', desc: 'Безсрочен, всички updates включени' }
              ].map((bt) => (
                <button
                  key={bt.id}
                  type="button"
                  onClick={() => setBillingType(bt.id as 'annual' | 'lifetime')}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    textAlign: 'left',
                    border: `2px solid ${billingType === bt.id ? '#7c3aed' : '#e5e7eb'}`,
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: billingType === bt.id ? '#f5f3ff' : 'white'
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: billingType === bt.id ? '#7c3aed' : '#374151' }}>
                    {bt.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{bt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {billingType === 'annual' ? (
            <div>
              <label style={labelStyle}>Дата на изтичане</label>
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} required style={fieldStyle} />
            </div>
          ) : (
            <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>♾️ Lifetime лиценз</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                Валиден до: {lifetimeExpiryDate().toLocaleDateString('bg-BG')}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                ✅ Всички бъдещи updates се прилагат автоматично
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Макс. потребители</label>
              <input type="number" min={1} value={maxUsers} onChange={(e) => setMaxUsers(Number(e.target.value))} style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Макс. инсталации</label>
              <input type="number" min={1} max={10} value={maxInstalls} onChange={(e) => setMaxInstalls(Number(e.target.value))} style={fieldStyle} />
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                Брой машини на които може да се инсталира
              </div>
            </div>
          </div>

          <div>
            <label style={{ ...labelStyle, marginBottom: 8 }}>Модули</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedFeatures(allModules.map((m) => m.id))}>
                Избери всички
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedFeatures([])}>
                Изчисти
              </Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {allModules.map((mod) => (
                <label key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(mod.id)}
                    onChange={(e) =>
                      setSelectedFeatures((prev) =>
                        e.target.checked ? [...prev, mod.id] : prev.filter((f) => f !== mod.id)
                      )
                    }
                    style={{ width: 15, height: 15, accentColor: '#7c3aed' }}
                  />
                  {mod.label}
                </label>
              ))}
            </div>
          </div>

          {price && (
            <div style={{
              background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
              border: '1px solid #ddd6fe', borderRadius: 12, padding: '16px 20px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#4c1d95', marginBottom: 10 }}>
                💰 Прайс калкулатор
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#6b7280' }}>Базова цена (до 10 потребители)</span>
                  <span style={{ fontWeight: 600 }}>{price.base} {price.currency}</span>
                </div>
                {price.usersExtra > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#6b7280' }}>Допълнителни потребители ({maxUsers})</span>
                    <span style={{ fontWeight: 600 }}>+{price.usersExtra} {price.currency}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 15, fontWeight: 800, color: '#4c1d95',
                  borderTop: '1px solid #ddd6fe', paddingTop: 8, marginTop: 4
                }}>
                  <span>Общо</span>
                  <span>{price.total} {price.currency}{price.suffix}</span>
                </div>
              </div>
              {billingType === 'annual' && pricing && (
                <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 8 }}>
                  💡 Lifetime еквивалент:{' '}
                  {pricing.lifetime.base +
                    (price.usersExtra > 0
                      ? maxUsers > 50
                        ? pricing.lifetime.users_51_plus
                        : maxUsers > 25
                          ? pricing.lifetime.users_26_50
                          : pricing.lifetime.users_11_25
                      : 0)}{' '}
                  {price.currency} (изплаща се за ~3 год.)
                </div>
              )}
            </div>
          )}

          <Button type="submit" size="lg" icon={<Zap size={16} />} fullWidth>
            Генерирай лиценз
          </Button>
        </form>
      </Card>

      {generated ? (
        <Card style={{ marginTop: 20, background: '#f0fdf4', border: '1px solid #86efac' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#166534', marginBottom: 6 }}>✓ Лицензът е генериран</div>
          <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#15803d' }}>{generated}</div>
        </Card>
      ) : null}
    </div>
  )
}
