import { FormEvent, useEffect, useState } from 'react'
import { supabase, Tenant } from '../lib/supabase'

function generateKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const seg = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${seg()}-${seg()}-${seg()}-${seg()}`
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
    await supabase.from('license_keys').insert({
      tenant_id: tenantId,
      key,
      features: selectedFeatures,
      max_users: maxUsers,
      expires_at: new Date(expiresAt).toISOString()
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

        <label>
          Изтича на
          <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} required style={{ display: 'block' }} />
        </label>

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
