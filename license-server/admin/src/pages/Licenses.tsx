import { useCallback, useEffect, useMemo, useState } from 'react'
import { LicenseKey, supabase } from '../lib/supabase'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Table, TableRow, Td } from '../components/ui/Table'

const MODULE_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  'module:wms': { label: 'WMS', bg: '#e0e7ff', color: '#3730a3' },
  'module:scm': { label: 'SCM', bg: '#d1fae5', color: '#065f46' },
  'module:mes': { label: 'MES', bg: '#fce7f3', color: '#9d174d' },
  'module:pos': { label: 'POS', bg: '#e0f2fe', color: '#0c4a6e' },
  'module:backup': { label: 'Backup', bg: '#dcfce7', color: '#14532d' },
  'module:finance': { label: 'Finance', bg: '#fef3c7', color: '#92400e' },
  'module:sales': { label: 'Sales', bg: '#ede9fe', color: '#5b21b6' },
  'module:service': { label: 'Service', bg: '#cffafe', color: '#0e7490' },
  'module:analytics': { label: 'Analytics', bg: '#fce7f3', color: '#9d174d' },
  'module:marketing': { label: 'Marketing', bg: '#ffedd5', color: '#9a3412' },
  'module:integrations': { label: 'Integrations', bg: '#e0e7ff', color: '#3730a3' }
}

const columns = [
  { key: 'key', label: 'Ключ' },
  { key: 'product', label: 'Продукт' },
  { key: 'client', label: 'Клиент' },
  { key: 'expires', label: 'Изтича' },
  { key: 'validated', label: 'Последна валидация' },
  { key: 'installs', label: 'Инсталации' },
  { key: 'modules', label: 'Модули' },
  { key: 'price', label: 'Цена' },
  { key: 'update', label: 'Обновление' },
  { key: 'status', label: 'Статус' },
  { key: 'action', label: 'Действие' },
]

export default function Licenses() {
  const [licenses, setLicenses] = useState<LicenseKey[]>([])
  const [productFilter, setProductFilter] = useState<'all' | 'erp' | 'crm'>('all')
  const [search, setSearch] = useState('')
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return licenses.filter((license) => {
      const product = license.product ?? 'erp'
      if (productFilter !== 'all' && product !== productFilter) return false
      if (!q) return true
      return (
        license.key.toLowerCase().includes(q) ||
        (license.tenant?.name ?? '').toLowerCase().includes(q) ||
        (license.tenant?.email ?? '').toLowerCase().includes(q) ||
        product.includes(q)
      )
    })
  }, [licenses, productFilter, search])

  return (
    <div>
      <PageHeader
        title="Лицензи"
        subtitle="Всички генерирани лицензни ключове"
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Търсене по ключ / клиент..."
          style={{
            flex: 1,
            minWidth: 200,
            padding: '8px 12px',
            border: '1.5px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 13
          }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {([
            { id: 'all' as const, label: 'Всички' },
            { id: 'erp' as const, label: 'ERP' },
            { id: 'crm' as const, label: 'CRM' }
          ]).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setProductFilter(opt.id)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: `1.5px solid ${productFilter === opt.id ? '#7c3aed' : '#e5e7eb'}`,
                background: productFilter === opt.id ? '#f5f3ff' : 'white',
                color: productFilter === opt.id ? '#7c3aed' : '#374151',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Table columns={columns} emptyMessage="Няма лицензи">
        {filtered.map((license) => {
          const product = license.product ?? 'erp'
          return (
          <TableRow key={license.id}>
            <Td>
              <button
                type="button"
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
            </Td>
            <Td>
              <Badge
                label={product === 'crm' ? 'CRM' : 'ERP'}
                bg={product === 'crm' ? '#ede9fe' : '#e0e7ff'}
                color={product === 'crm' ? '#5b21b6' : '#3730a3'}
              />
            </Td>
            <Td><span style={{ fontWeight: 600 }}>{license.tenant?.name ?? '—'}</span></Td>
            <Td style={{ color: '#6b7280' }}>
              {license.billing_type === 'lifetime' ? '♾️' : new Date(license.expires_at).toLocaleDateString('bg-BG')}
            </Td>
            <Td style={{ color: '#6b7280', fontSize: 12 }}>
              {license.last_validated_at ? new Date(license.last_validated_at).toLocaleString('bg-BG') : '—'}
            </Td>
            <Td>
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
            </Td>
            <Td>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {(license.features || []).map((feature: string) => {
                  const badge = MODULE_BADGES[feature]
                  if (!badge) return null
                  return (
                    <Badge key={feature} label={badge.label} bg={badge.bg} color={badge.color} />
                  )
                })}
                {(!license.features || license.features.length === 0) && (
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>—</span>
                )}
              </div>
            </Td>
            <Td>
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
            </Td>
            <Td>
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
                  <Button
                    size="sm"
                    onClick={async () => {
                      await supabase
                        .from('license_keys')
                        .update({ allowed_version: editingVersion.value || null })
                        .eq('id', license.id)
                      setEditingVersion(null)
                      await refetch()
                    }}
                  >
                    ✓
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      await supabase.from('license_keys').update({ allowed_version: null }).eq('id', license.id)
                      setEditingVersion(null)
                      await refetch()
                    }}
                  >
                    ✕
                  </Button>
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
                    <Badge
                      label={`↑ v${license.allowed_version}`}
                      bg="#f0fdf4"
                      color="#16a34a"
                    />
                  ) : (
                    <span style={{ color: '#d1d5db', fontSize: 11 }}>— няма</span>
                  )}
                </div>
              )}
            </Td>
            <Td>
              <Badge
                label={license.is_active ? 'Активен' : 'Неактивен'}
                bg={license.is_active ? '#dcfce7' : '#fee2e2'}
                color={license.is_active ? '#166534' : '#991b1b'}
              />
            </Td>
            <Td>
              <button
                type="button"
                onClick={async () => {
                  await supabase
                    .from('license_keys')
                    .update({ is_active: !license.is_active })
                    .eq('id', license.id)
                  void refetch()
                }}
                style={{
                  padding: '5px 12px', border: 'none', borderRadius: 6,
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  fontFamily: 'inherit',
                  background: license.is_active ? '#fee2e2' : '#dcfce7',
                  color:      license.is_active ? '#dc2626' : '#059669',
                  transition: 'all 0.15s',
                }}>
                {license.is_active ? 'Деактивирай' : 'Активирай'}
              </button>
            </Td>
          </TableRow>
          )
        })}
      </Table>
    </div>
  )
}
