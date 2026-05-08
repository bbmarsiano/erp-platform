import { FormEvent, useEffect, useState } from 'react'
import { supabase, Tenant } from '../lib/supabase'

function generateKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const seg = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${seg()}-${seg()}-${seg()}-${seg()}`
}

const allFeatures = ['module:wms', 'module:scm', 'module:mes', 'module:pos', 'module:backup']

export default function GenerateLicense() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantId, setTenantId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [maxUsers, setMaxUsers] = useState(10)
  const [features, setFeatures] = useState<string[]>(allFeatures)
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

  const toggleFeature = (feature: string) => {
    setFeatures((current) =>
      current.includes(feature) ? current.filter((f) => f !== feature) : [...current, feature]
    )
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const key = generateKey()
    await supabase.from('license_keys').insert({
      tenant_id: tenantId,
      key,
      features,
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

        <div>
          <div>Features</div>
          {allFeatures.map((feature) => (
            <label key={feature} style={{ display: 'block' }}>
              <input
                type="checkbox"
                checked={features.includes(feature)}
                onChange={() => toggleFeature(feature)}
              />{' '}
              {feature}
            </label>
          ))}
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

