import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/auth.store'
import { api } from '../lib/api'

type SettingsTab = 'profile' | 'system' | 'license' | 'company'

function CompanySettings() {
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api
      .get('/api/tenant')
      .then((r) => {
        setName(r.data.data.name || '')
        setLogoUrl(r.data.data.logoUrl || '')
      })
      .catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true)
    await api.put('/api/tenant', { name, logoUrl: logoUrl || null })
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        padding: 24
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>Настройки на фирмата</h2>
      <div style={{ display: 'grid', gap: 16, maxWidth: 480 }}>
        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: '#374151',
              display: 'block',
              marginBottom: 6
            }}
          >
            Наименование на фирмата
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14,
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: '#374151',
              display: 'block',
              marginBottom: 6
            }}
          >
            URL на лого
            <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>
              (линк към изображение — https://...)
            </span>
          </label>
          <input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14,
              boxSizing: 'border-box'
            }}
          />
        </div>
        {logoUrl && (
          <div
            style={{
              padding: 16,
              background: '#f9fafb',
              borderRadius: 8,
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Преглед:</div>
            <img
              src={logoUrl}
              alt="Logo preview"
              style={{ maxHeight: 48, maxWidth: 200, objectFit: 'contain' }}
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>powered by DFlowERP</div>
          </div>
        )}
        <button
          onClick={() => void save()}
          disabled={saving}
          style={{
            padding: '10px 20px',
            background: saving ? '#6b7280' : '#111',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            alignSelf: 'flex-start'
          }}
        >
          {saving ? 'Запазване...' : saved ? '✓ Запазено!' : 'Запази настройките'}
        </button>
      </div>
    </div>
  )
}

export default function Settings() {
  const user = useAuthStore((s) => s.user)
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  const tabs = [
    { id: 'profile' as const, label: 'Профил' },
    { id: 'system' as const, label: 'Система' },
    { id: 'license' as const, label: 'Лиценз' },
    { id: 'company' as const, label: 'Фирма' }
  ]

  return (
    <div style={{ padding: '32px', maxWidth: 800 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 24px' }}>Настройки</h1>

      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 24,
          borderBottom: '1px solid #e5e7eb'
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              border: 'none',
              cursor: 'pointer',
              background: 'none',
              fontSize: 14,
              fontWeight: 500,
              color: activeTab === tab.id ? '#111' : '#6b7280',
              borderBottom: activeTab === tab.id ? '2px solid #111' : '2px solid transparent',
              marginBottom: -1
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: 24
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>Информация за профила</h2>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>Имейл</div>
              <div
                style={{
                  fontSize: 14,
                  padding: '10px 12px',
                  background: '#f9fafb',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb'
                }}
              >
                {user?.email}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>Роля</div>
              <div
                style={{
                  fontSize: 14,
                  padding: '10px 12px',
                  background: '#f9fafb',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb'
                }}
              >
                {user?.role}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>Tenant ID</div>
              <div
                style={{
                  fontSize: 13,
                  padding: '10px 12px',
                  fontFamily: 'monospace',
                  background: '#f9fafb',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  color: '#6b7280'
                }}
              >
                {user?.tenantId}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: 24
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>Системна информация</h2>
          <div style={{ display: 'grid', gap: 12, fontSize: 14 }}>
            {[
              { label: 'Версия', value: 'DFlowERP v0.1.0' },
              { label: 'API URL', value: import.meta.env.VITE_API_URL || 'http://localhost:3001' },
              { label: 'Среда', value: import.meta.env.MODE },
              {
                label: 'API Документация',
                value: (
                  <a
                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/docs`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#2563eb' }}
                  >
                    Отвори Swagger UI →
                  </a>
                )
              }
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: '#f9fafb',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb'
                }}
              >
                <span style={{ fontWeight: 500, color: '#374151' }}>{label}</span>
                <span style={{ color: '#6b7280' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'license' && (
        <div
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: 24
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>Информация за лиценза</h2>
          <div style={{ display: 'grid', gap: 12, fontSize: 14 }}>
            {[
              { label: 'Лиценз ключ', value: 'DEMO-0000-0000-0000' },
              {
                label: 'Статус',
                value: (
                  <span
                    style={{
                      padding: '2px 10px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 500,
                      background: '#dcfce7',
                      color: '#166534'
                    }}
                  >
                    Активен
                  </span>
                )
              },
              {
                label: 'Активни модули',
                value: (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {['WMS', 'SCM', 'MES', 'POS', 'Backup'].map((m) => (
                      <span
                        key={m}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 20,
                          fontSize: 11,
                          background: '#dbeafe',
                          color: '#1e40af'
                        }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )
              }
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: '#f9fafb',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb'
                }}
              >
                <span style={{ fontWeight: 500, color: '#374151' }}>{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'company' && <CompanySettings />}
    </div>
  )
}
