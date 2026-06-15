import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, FormField, FormRow, Input, PageHeader } from '../../../components/ui'
import { StatusBadge } from '../components/StatusBadge'
import { WarehouseSelector } from '../components/WarehouseSelector'
import { useCreateReceipt, useReceipts, useWarehouses } from '../hooks/useWms'

export default function Receipts() {
  const navigate = useNavigate()
  const receipts = useReceipts()
  const warehouses = useWarehouses()
  const createReceipt = useCreateReceipt()

  const [showForm, setShowForm] = useState(false)
  const [warehouseId, setWarehouseId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [note, setNote] = useState('')

  const rows = useMemo(() => (receipts.data ?? []) as Array<any>, [receipts.data])
  const warehouseMap = useMemo(() => {
    const ws = (warehouses.data ?? []) as Array<{ id: string; name: string; code: string }>
    return new Map(ws.map((w) => [w.id, `${w.code} — ${w.name}`]))
  }, [warehouses.data])

  const onSubmit = async () => {
    if (!warehouseId) return
    const created = await createReceipt.mutateAsync({
      warehouseId,
      supplierName: supplierName.trim() || undefined,
      note: note.trim() || undefined
    })
    setShowForm(false)
    setWarehouseId('')
    setSupplierName('')
    setNote('')
    if (created?.id) navigate(`/wms/receipts/${created.id}`)
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Приходни"
        subtitle="Документи за приемане на стока"
        help={{
          title: 'Приемане',
          content:
            'Приходните документи записват получени стоки в склада. Създайте документ, добавете артикули и потвърдете за да осчетоводите прихода.'
        }}
        action={!showForm ? <Button onClick={() => setShowForm(true)}>Нова приходна бележка</Button> : undefined}
      />

      {showForm ? (
        <Card style={{ marginBottom: 20 }}>
          <FormRow columns={3}>
            <FormField label="Склад" required>
              <WarehouseSelector value={warehouseId} onChange={setWarehouseId} placeholder="Изберете склад" />
            </FormField>
            <FormField label="Доставчик">
              <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Име на доставчик" />
            </FormField>
            <FormField label="Бележка">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="По избор" />
            </FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Отказ
            </Button>
            <Button onClick={onSubmit} disabled={createReceipt.isPending}>
              {createReceipt.isPending ? 'Запис...' : 'Създай'}
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
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Доставчик</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Статус</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Дата</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {receipts.isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: 12, color: '#6b7280' }}>
                  Зареждане...
                </td>
              </tr>
            ) : receipts.error ? (
              <tr>
                <td colSpan={6} style={{ padding: 12, color: '#991b1b' }}>
                  Грешка при зареждане на приходни документи
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
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }}>{r.receiptNo}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{warehouseMap.get(r.warehouseId) ?? '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 13 }}>{r.supplierName ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={r.status} />
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 13 }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleString('bg-BG') : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/wms/receipts/${r.id}`)}>
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
