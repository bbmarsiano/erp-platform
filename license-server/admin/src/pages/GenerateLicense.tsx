import { FormEvent, useEffect, useState } from 'react'
import { supabase, Tenant } from '../lib/supabase'

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
  { id: 'module:backup', label: '💾 Backup — Архивиране' }
]

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

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('tenants').select('*').eq('is_active', true).order('name')
      const rows = (data as Tenant[]) ?? []
      setTenants(rows)
      if (rows[0]) setTenantId(rows[0].id)
    }
    void load()
  }, [])

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
      allowed_version: null
    })
    setGenerated(key)
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Generate License</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 640 }}>
        <label>
          Клиент
          <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} required style={{ display: 'block', width: '100%' }}>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name} ({tenant.email})
              </option>
            ))}
          </select>
        </label>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: '#374151',
              marginBottom: 8
            }}
          >
            Тип лиценз
          </label>
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
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: billingType === bt.id ? '#7c3aed' : '#374151'
                  }}
                >
                  {bt.label}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{bt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {billingType === 'annual' ? (
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 6
              }}
            >
              Дата на изтичане
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1.5px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 13
              }}
            />
          </div>
        ) : (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 16px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 10
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>♾️ Lifetime лиценз</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
              Валиден до: {lifetimeExpiryDate().toLocaleDateString('bg-BG')}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              ✅ Всички бъдещи updates се прилагат автоматично
            </div>
          </div>
        )}

        <label>
          Max users
          <input type="number" min={1} value={maxUsers} onChange={(e) => setMaxUsers(Number(e.target.value))} style={{ display: 'block' }} />
        </label>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: '#374151',
              marginBottom: 8
            }}
          >
            Модули
          </label>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => setSelectedFeatures(allModules.map((m) => m.id))}
              style={{
                fontSize: 11,
                padding: '3px 10px',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                cursor: 'pointer',
                background: 'white'
              }}
            >
              Избери всички
            </button>
            <button
              type="button"
              onClick={() => setSelectedFeatures([])}
              style={{
                fontSize: 11,
                padding: '3px 10px',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                cursor: 'pointer',
                background: 'white'
              }}
            >
              Изчисти
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {allModules.map((mod) => (
              <label
                key={mod.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
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

        <button type="submit">Generate</button>
      </form>

      {generated ? (
        <div style={{ marginTop: 16, padding: 12, background: '#dcfce7', border: '1px solid #22c55e', borderRadius: 8 }}>
          Generated key: <strong>{generated}</strong>
        </div>
      ) : null}
    </div>
  )
}
