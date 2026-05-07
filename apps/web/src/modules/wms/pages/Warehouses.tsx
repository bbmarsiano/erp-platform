import { useMemo, useState } from 'react'
import { Button } from '../../../components/ui/Button'
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
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Складове</div>
          <div style={{ marginTop: 4, color: '#6b7280', fontSize: 13 }}>Управление на складове и адреси</div>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Отказ' : 'Нов склад'}</Button>
      </div>

      {showForm ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: 16,
            marginBottom: 14,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr auto',
            gap: 10,
            alignItems: 'end'
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#374151' }}>
            Код
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="WH-01"
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d4d4d8' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#374151' }}>
            Наименование
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Основен склад"
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d4d4d8' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#374151' }}>
            Адрес
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="София, България"
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d4d4d8' }}
            />
          </label>
          <Button onClick={onSubmit} disabled={createWarehouse.isPending} style={{ height: 38 }}>
            {createWarehouse.isPending ? 'Запис...' : 'Създай'}
          </Button>
        </div>
      ) : null}

      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 10 }}>Код</th>
              <th style={{ padding: 10 }}>Наименование</th>
              <th style={{ padding: 10 }}>Адрес</th>
              <th style={{ padding: 10 }}>Статус</th>
              <th style={{ padding: 10 }}>Действия</th>
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
                  <td style={{ padding: 10, fontFamily: 'monospace' }}>{w.code}</td>
                  <td style={{ padding: 10, fontWeight: 700 }}>{w.name}</td>
                  <td style={{ padding: 10, color: '#6b7280' }}>{w.address ?? '—'}</td>
                  <td style={{ padding: 10 }}>{w.isActive ? <StatusBadge status="CONFIRMED" /> : <StatusBadge status="CANCELLED" />}</td>
                  <td style={{ padding: 10, color: '#6b7280' }}>—</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

