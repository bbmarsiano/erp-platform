import { useMemo, useState } from 'react'
import { Button, Card, FormField, FormRow, Input, PageHeader } from '../../../components/ui'
import { StatusBadge } from '../components/StatusBadge'
import { useCreateWarehouse, useWarehouses } from '../hooks/useWms'

export default function Warehouses() {
  const { data, isLoading, error } = useWarehouses()
  const createWarehouse = useCreateWarehouse()

  const [showForm, setShowForm] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')

  const rows = useMemo(() => (data ?? []) as Array<{ id: string; code: string; name: string; address?: string; isActive: boolean }>, [data])

  const onSubmit = async () => {
    if (!code.trim() || !name.trim()) return
    await createWarehouse.mutateAsync({ code: code.trim(), name: name.trim(), address: address.trim() || undefined })
    setCode('')
    setName('')
    setAddress('')
    setShowForm(false)
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Складове"
        subtitle="Управление на складове и адреси"
        action={!showForm ? <Button onClick={() => setShowForm(true)}>Нов склад</Button> : undefined}
      />

      {showForm ? (
        <Card style={{ marginBottom: 20 }}>
          <FormRow columns={3}>
            <FormField label="Код" required>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="WH-01" />
            </FormField>
            <FormField label="Наименование" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Основен склад" />
            </FormField>
            <FormField label="Адрес">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="София, България" />
            </FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Отказ
            </Button>
            <Button onClick={onSubmit} disabled={createWarehouse.isPending}>
              {createWarehouse.isPending ? 'Запис...' : 'Създай'}
            </Button>
          </div>
        </Card>
      ) : null}

      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Код</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Наименование</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Адрес</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Статус</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ padding: 12, color: '#6b7280' }}>
                  Зареждане...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} style={{ padding: 12, color: '#991b1b' }}>
                  Грешка при зареждане на складове
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 12, color: '#6b7280' }}>
                  Няма складове
                </td>
              </tr>
            ) : (
              rows.map((w) => (
                <tr key={w.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }}>{w.code}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13 }}>{w.name}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 13 }}>{w.address ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}>{w.isActive ? <StatusBadge status="CONFIRMED" /> : <StatusBadge status="CANCELLED" />}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 13 }}>—</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
