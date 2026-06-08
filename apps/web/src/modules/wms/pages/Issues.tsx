import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, FormField, FormRow, Input, PageHeader } from '../../../components/ui'
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
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Експедиции"
        subtitle="Документи за изписване на стока"
        action={!showForm ? <Button onClick={() => setShowForm(true)}>Нова експедиция</Button> : undefined}
      />

      {showForm ? (
        <Card style={{ marginBottom: 20 }}>
          <FormRow columns={3}>
            <FormField label="Склад" required>
              <WarehouseSelector value={warehouseId} onChange={setWarehouseId} placeholder="Изберете склад" />
            </FormField>
            <FormField label="Дестинация">
              <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Клиент / адрес" />
            </FormField>
            <FormField label="Бележка">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="По избор" />
            </FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Отказ
            </Button>
            <Button onClick={onSubmit} disabled={createIssue.isPending}>
              {createIssue.isPending ? 'Запис...' : 'Създай'}
            </Button>
          </div>
        </Card>
      ) : null}

      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Номер</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Склад</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Дестинация</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Статус</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Дата</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Действия</th>
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
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }}>{r.issueNo}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{warehouseMap.get(r.warehouseId) ?? '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 13 }}>{r.destination ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={r.status} />
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 13 }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleString('bg-BG') : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/wms/issues/${r.id}`)}>
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
