import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { StatusBadge } from '../components/StatusBadge'
import { WarehouseSelector } from '../components/WarehouseSelector'
import { useCreateIssue, useIssues, useWarehouses } from '../hooks/useWms'

export default function Issues() {
  const navigate = useNavigate()
  const issues = useIssues()
  const warehouses = useWarehouses()
  const createIssue = useCreateIssue()

  const [showForm, setShowForm] = useState(false)
  const [warehouseId, setWarehouseId] = useState('')
  const [destination, setDestination] = useState('')
  const [note, setNote] = useState('')

  const rows = useMemo(() => (issues.data ?? []) as Array<any>, [issues.data])
  const warehouseMap = useMemo(() => {
    const ws = (warehouses.data ?? []) as Array<{ id: string; name: string; code: string }>
    return new Map(ws.map((w) => [w.id, `${w.code} — ${w.name}`]))
  }, [warehouses.data])

  const onSubmit = async () => {
    if (!warehouseId) return
    const created = await createIssue.mutateAsync({
      warehouseId,
      destination: destination.trim() || undefined,
      note: note.trim() || undefined
    })
    setShowForm(false)
    setWarehouseId('')
    setDestination('')
    setNote('')
    if (created?.id) navigate(`/wms/issues/${created.id}`)
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Експедиции</div>
          <div style={{ marginTop: 4, color: '#6b7280', fontSize: 13 }}>Документи за изписване на стока</div>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Отказ' : 'Нова експедиция'}</Button>
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
            Склад
            <WarehouseSelector value={warehouseId} onChange={setWarehouseId} placeholder="Изберете склад" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#374151' }}>
            Дестинация
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Клиент / адрес"
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d4d4d8' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#374151' }}>
            Бележка
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="По избор"
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d4d4d8' }}
            />
          </label>
          <Button onClick={onSubmit} disabled={createIssue.isPending} style={{ height: 38 }}>
            {createIssue.isPending ? 'Запис...' : 'Създай'}
          </Button>
        </div>
      ) : null}

      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 10 }}>Номер</th>
              <th style={{ padding: 10 }}>Склад</th>
              <th style={{ padding: 10 }}>Дестинация</th>
              <th style={{ padding: 10 }}>Статус</th>
              <th style={{ padding: 10 }}>Дата</th>
              <th style={{ padding: 10 }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {issues.isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: 12, color: '#6b7280' }}>
                  Зареждане...
                </td>
              </tr>
            ) : issues.error ? (
              <tr>
                <td colSpan={6} style={{ padding: 12, color: '#991b1b' }}>
                  Грешка при зареждане на експедиции
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 12, color: '#6b7280' }}>
                  Няма документи
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: 10, fontFamily: 'monospace' }}>{r.issueNo}</td>
                  <td style={{ padding: 10 }}>{warehouseMap.get(r.warehouseId) ?? '—'}</td>
                  <td style={{ padding: 10, color: '#6b7280' }}>{r.destination ?? '—'}</td>
                  <td style={{ padding: 10 }}>
                    <StatusBadge status={r.status} />
                  </td>
                  <td style={{ padding: 10, color: '#6b7280' }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleString('bg-BG') : '—'}
                  </td>
                  <td style={{ padding: 10 }}>
                    <Button
                      onClick={() => navigate(`/wms/issues/${r.id}`)}
                      style={{ background: '#ffffff', color: '#111827', border: '1px solid #e5e7eb' }}
                    >
                      Преглед
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

