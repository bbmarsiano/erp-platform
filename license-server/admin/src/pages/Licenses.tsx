import { useCallback, useEffect, useState } from 'react'
import { LicenseKey, supabase } from '../lib/supabase'

const MODULE_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  'module:wms': { label: 'WMS', bg: '#e0e7ff', color: '#3730a3' },
  'module:scm': { label: 'SCM', bg: '#d1fae5', color: '#065f46' },
  'module:mes': { label: 'MES', bg: '#fce7f3', color: '#9d174d' },
  'module:pos': { label: 'POS', bg: '#e0f2fe', color: '#0c4a6e' },
  'module:backup': { label: 'Backup', bg: '#dcfce7', color: '#14532d' }
}

export default function Licenses() {
  const [licenses, setLicenses] = useState<LicenseKey[]>([])
  const [editingVersion, setEditingVersion] = useState<{ id: string; value: string } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyKey = (id: string, key: string) => {
    navigator.clipboard.writeText(key)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from('license_keys')
      .select('*, tenant:tenants(*)')
      .order('created_at', { ascending: false })
    if (data) setLicenses(data as LicenseKey[])
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const deactivate = async (id: string) => {
    await supabase.from('license_keys').update({ is_active: false }).eq('id', id)
    await refetch()
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Лицензи</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Ключ</th>
            <th align="left">Клиент</th>
            <th align="left">Изтича</th>
            <th align="left">Последна валидация</th>
            <th
              style={{
                padding: '11px 16px',
                textAlign: 'left',
                fontSize: 12,
                fontWeight: 600,
                color: '#6b7280'
              }}
            >
              Инсталации
            </th>
            <th
              style={{
                padding: '11px 16px',
                textAlign: 'left',
                fontSize: 12,
                fontWeight: 600,
                color: '#6b7280'
              }}
            >
              Модули
            </th>
            <th
              style={{
                padding: '11px 16px',
                textAlign: 'left',
                fontSize: 12,
                fontWeight: 600,
                color: '#6b7280'
              }}
            >
              Цена
            </th>
            <th align="left">Обновление</th>
            <th align="left">Статус</th>
            <th align="left">Действие</th>
          </tr>
        </thead>
        <tbody>
          {licenses.map((license) => (
            <tr key={license.id}>
              <td style={{ padding: '12px 16px' }}>
                <button
                  onClick={() => copyKey(license.id, license.key)}
                  title={`Копирай: ${license.key}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    background: copiedId === license.id ? '#dcfce7' : '#f8fafc',
                    border: `1px solid ${copiedId === license.id ? '#86efac' : '#e5e7eb'}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: 12,
                    fontWeight: 600,
                    color: copiedId === license.id ? '#15803d' : '#374151',
                    transition: 'all 0.15s'
                  }}
                >
                  {copiedId === license.id
                    ? '✓ Копирано!'
                    : `${license.key.substring(0, 4)}-****-****-****`}
                </button>
              </td>
              <td>{license.tenant?.name ?? '-'}</td>
              <td>{new Date(license.expires_at).toLocaleDateString('bg-BG')}</td>
              <td>{license.last_validated_at ? new Date(license.last_validated_at).toLocaleString('bg-BG') : '-'}</td>
              <td style={{ padding: '12px 16px' }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color:
                      (license.install_count ?? 0) >= (license.max_installs ?? 3)
                        ? '#dc2626'
                        : '#374151'
                  }}
                >
                  {license.install_count ?? 0} / {license.max_installs ?? 3}
                </span>
                {(license.install_count ?? 0) >= (license.max_installs ?? 3) && (
                  <div style={{ fontSize: 10, color: '#dc2626' }}>⚠ лимит</div>
                )}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(license.features || []).map((feature: string) => {
                    const badge = MODULE_BADGES[feature]
                    if (!badge) return null
                    return (
                      <span
                        key={feature}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 20,
                          fontSize: 10,
                          fontWeight: 700,
                          background: badge.bg,
                          color: badge.color,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {badge.label}
                      </span>
                    )
                  })}
                  {(!license.features || license.features.length === 0) && (
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>—</span>
                  )}
                </div>
              </td>
              <td style={{ padding: '12px 16px', fontSize: 13 }}>
                {license.price_paid != null ? (
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>
                    {license.price_paid} {license.currency || 'EUR'}
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>
                      {license.billing_type === 'lifetime' ? 'еднократно' : '/год'}
                    </div>
                  </span>
                ) : (
                  <span style={{ color: '#9ca3af', fontSize: 11 }}>—</span>
                )}
              </td>
              <td style={{ padding: '12px 16px' }}>
                {editingVersion?.id === license.id ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      value={editingVersion.value}
                      onChange={(e) => setEditingVersion({ id: license.id, value: e.target.value })}
                      placeholder="0.3.0"
                      style={{
                        width: 80,
                        padding: '4px 8px',
                        border: '1.5px solid #7c3aed',
                        borderRadius: 6,
                        fontSize: 12,
                        outline: 'none',
                        fontFamily: 'monospace'
                      }}
                      autoFocus
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          await supabase
                            .from('license_keys')
                            .update({ allowed_version: editingVersion.value || null })
                            .eq('id', license.id)
                          setEditingVersion(null)
                          await refetch()
                        }
                        if (e.key === 'Escape') setEditingVersion(null)
                      }}
                    />
                    <button
                      onClick={async () => {
                        await supabase
                          .from('license_keys')
                          .update({ allowed_version: editingVersion.value || null })
                          .eq('id', license.id)
                        setEditingVersion(null)
                        await refetch()
                      }}
                      style={{
                        padding: '4px 8px',
                        background: '#7c3aed',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 11
                      }}
                    >
                      ✓
                    </button>
                    <button
                      onClick={async () => {
                        await supabase.from('license_keys').update({ allowed_version: null }).eq('id', license.id)
                        setEditingVersion(null)
                        await refetch()
                      }}
                      style={{
                        padding: '4px 8px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 11
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingVersion({ id: license.id, value: license.allowed_version || '' })}
                    style={{
                      cursor: 'pointer',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {license.allowed_version ? (
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          background: '#f0fdf4',
                          color: '#16a34a',
                          border: '1px solid #bbf7d0',
                          fontFamily: 'monospace'
                        }}
                      >
                        ↑ v{license.allowed_version}
                      </span>
                    ) : (
                      <span style={{ color: '#d1d5db', fontSize: 11 }}>— няма</span>
                    )}
                  </div>
                )}
              </td>
              <td>{license.is_active ? 'Активен' : 'Неактивен'}</td>
              <td>
                <button disabled={!license.is_active} onClick={() => void deactivate(license.id)}>
                  Deactivate
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
