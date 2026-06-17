import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/auth.store'
import { api } from '../lib/api'
import { APP_VERSION } from '../version'
import { HelpTooltip } from '../components/ui'

type SettingsTab = 'profile' | 'system' | 'license' | 'company'

interface LicenseInfo {
  valid?: boolean
  key?: string
  features?: string[]
  expiresAt?: string | null
  maxUsers?: number
  daysRemaining?: number
  billingType?: string | null
  isLifetime?: boolean
}

const MODULE_LABELS: Record<string, string> = {
  'module:wms': 'WMS',
  'module:scm': 'SCM',
  'module:mes': 'MES',
  'module:pos': 'POS',
  'module:backup': 'Backup'
}

function LicenseSettings() {
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null)

  useEffect(() => {
    api
      .get('/api/license/info')
      .then((r) => setLicenseInfo(r.data.data))
      .catch(() => setLicenseInfo(null))
  }, [])

  const isLifetime = licenseInfo?.billingType === 'lifetime' || licenseInfo?.isLifetime
  const isExpiringSoon =
    !isLifetime && licenseInfo?.daysRemaining != null && licenseInfo.daysRemaining < 30

  const rows = [
    {
      label: 'Лиценз ключ',
      value: licenseInfo?.key ? `${licenseInfo.key.substring(0, 4)}-****-****-****` : '—'
    },
    { label: 'Статус', value: licenseInfo?.valid ? '✅ Активен' : '❌ Неактивен' },
    { label: 'Тип', value: isLifetime ? '♾️ Lifetime' : '📅 Годишен (SaaS)' },
    ...(!isLifetime
      ? [
          {
            label: 'Изтича на',
            value: licenseInfo?.expiresAt
              ? new Date(licenseInfo.expiresAt).toLocaleDateString('bg-BG')
              : '—'
          }
        ]
      : []),
    { label: 'Максимален брой потребители', value: licenseInfo?.maxUsers || '—' }
  ]

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        padding: 24
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>Информация за лиценза</h2>

      {isLifetime && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: 20,
            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
            border: '1px solid #86efac',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <span style={{ fontSize: 20 }}>♾️</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d' }}>Lifetime лиценз</div>
            <div style={{ fontSize: 12, color: '#166534' }}>
              Безсрочен лиценз — всички бъдещи версии са включени
            </div>
          </div>
        </div>
      )}

      {isExpiringSoon && !isLifetime && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: 20,
            background: '#fef9c3',
            border: '1px solid #fde047',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div style={{ fontSize: 13, color: '#854d0e' }}>
            Лицензът изтича след <strong>{licenseInfo?.daysRemaining} дни</strong>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid #f3f4f6'
            }}
          >
            <span style={{ fontSize: 13, color: '#6b7280' }}>{row.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{row.value}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Активни модули</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(licenseInfo?.features || []).map((f) => (
            <span
              key={f}
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                background: '#f0fdf4',
                color: '#166534',
                fontSize: 12,
                fontWeight: 700,
                border: '1px solid #86efac'
              }}
            >
              {MODULE_LABELS[f] || f}
            </span>
          ))}
          {!licenseInfo?.features?.length && (
            <span style={{ fontSize: 12, color: '#9ca3af' }}>—</span>
          )}
        </div>
      </div>
    </div>
  )
}

function CompanySettings() {
  const [form, setForm] = useState({
    name: '',
    logoUrl: '',
    address: '',
    eik: '',
    vatNumber: '',
    vatRegistered: false,
    mol: '',
    city: '',
    country: 'България',
    phone: '',
    email: '',
    bankName: '',
    bankIban: ''
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api
      .get('/api/tenant')
      .then((r) => {
        const t = r.data.data
        setForm({
          name: t.name || '',
          logoUrl: t.logoUrl || '',
          address: t.address || '',
          eik: t.eik || '',
          vatNumber: t.vatNumber || '',
          vatRegistered: t.vatRegistered || false,
          mol: t.mol || '',
          city: t.city || '',
          country: t.country || 'България',
          phone: t.phone || '',
          email: t.email || '',
          bankName: t.bankName || '',
          bankIban: t.bankIban || ''
        })
      })
      .catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true)
    await api.put('/api/tenant', form)
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    border: '1.5px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none'
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6
  }

  const section = (title: string) => (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#7c3aed',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginTop: 20,
        marginBottom: 12,
        paddingBottom: 6,
        borderBottom: '1px solid #e5e7eb'
      }}
    >
      {title}
    </div>
  )

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>Настройки на фирмата</h2>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px' }}>
        Тези данни се използват в касови бележки и фактури
      </p>

      {section('Основни данни')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Наименование на фирмата *</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            style={fieldStyle}
            onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
        </div>
        <div>
          <label style={labelStyle}>МОЛ (Управител)</label>
          <input
            value={form.mol}
            onChange={(e) => setForm((f) => ({ ...f, mol: e.target.value }))}
            placeholder="Иван Иванов"
            style={fieldStyle}
            onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
        </div>
      </div>

      {section('Данъчни данни')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>ЕИК / Булстат *</label>
          <input
            value={form.eik}
            onChange={(e) => setForm((f) => ({ ...f, eik: e.target.value }))}
            placeholder="123456789"
            style={fieldStyle}
            onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
        </div>
        <div>
          <label style={labelStyle}>ДДС номер</label>
          <input
            value={form.vatNumber}
            onChange={(e) => setForm((f) => ({ ...f, vatNumber: e.target.value }))}
            placeholder="BG123456789"
            style={fieldStyle}
            onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
          <input
            type="checkbox"
            checked={form.vatRegistered}
            onChange={(e) => setForm((f) => ({ ...f, vatRegistered: e.target.checked }))}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          Регистриран по ДДС
        </label>
      </div>

      {section('Адрес')}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Адрес на седалище</label>
          <input
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="ул. Примерна 1"
            style={fieldStyle}
            onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
        </div>
        <div>
          <label style={labelStyle}>Град</label>
          <input
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            placeholder="София"
            style={fieldStyle}
            onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
        </div>
        <div>
          <label style={labelStyle}>Държава</label>
          <input
            value={form.country}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            style={fieldStyle}
            onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
        </div>
      </div>

      {section('Контакти')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Телефон</label>
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+359 2 000 0000"
            style={fieldStyle}
            onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
        </div>
        <div>
          <label style={labelStyle}>Имейл</label>
          <input
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="info@firma.bg"
            style={fieldStyle}
            onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
        </div>
      </div>

      {section('Банкова информация')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Банка</label>
          <input
            value={form.bankName}
            onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
            placeholder="ОББ"
            style={fieldStyle}
            onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
        </div>
        <div>
          <label style={labelStyle}>IBAN</label>
          <input
            value={form.bankIban}
            onChange={(e) => setForm((f) => ({ ...f, bankIban: e.target.value }))}
            placeholder="BG80BNBG96611020345678"
            style={{ ...fieldStyle, fontFamily: 'monospace' }}
            onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
        </div>
      </div>

      {section('Лого')}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>URL на лого</label>
        <input
          value={form.logoUrl}
          onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
          placeholder="https://example.com/logo.png"
          style={fieldStyle}
          onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
          onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
        />
        {form.logoUrl && (
          <img
            src={form.logoUrl}
            alt="preview"
            style={{ marginTop: 8, maxHeight: 40, objectFit: 'contain' }}
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        )}
      </div>

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        style={{
          padding: '10px 24px',
          background: saving ? '#6b7280' : '#0f172a',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit'
        }}
      >
        {saving ? 'Запазване...' : saved ? '✓ Запазено!' : 'Запази настройките'}
      </button>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Настройки</h1>
        <HelpTooltip
          title="Настройки"
          content="Профил — лични данни. Фирма — данни за касови бележки и фактури. Лиценз — информация за абонамента. Система — техническа информация."
        />
      </div>

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
              { label: 'Версия', value: `DFlowERP v${APP_VERSION}` },
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

      {activeTab === 'license' && <LicenseSettings />}

      {activeTab === 'company' && <CompanySettings />}
    </div>
  )
}
