import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, FormField, FormRow, Input, PageHeader, Select, StatusBadge } from '../../../components/ui'
import { WarehouseSelector } from '../../wms/components/WarehouseSelector'
import { useCreatePurchaseOrder, usePurchaseOrders, useSuppliers } from '../hooks/useScm'

const poStatusMap: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: 'Чернова', bg: '#fef9c3', color: '#854d0e' },
  SENT: { label: 'Изпратена', bg: '#dbeafe', color: '#1e40af' },
  PARTIALLY_RECEIVED: { label: 'Частично получена', bg: '#fed7aa', color: '#9a3412' },
  RECEIVED: { label: 'Получена', bg: '#dcfce7', color: '#166534' },
  CANCELLED: { label: 'Анулирана', bg: '#fee2e2', color: '#991b1b' }
}

export default function PurchaseOrders() {
  const navigate = useNavigate()
  const orders = usePurchaseOrders()
  const suppliers = useSuppliers()
  const createOrder = useCreatePurchaseOrder()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ supplierId: '', warehouseId: '', expectedDate: '', note: '' })
  const supplierOptions = (suppliers.data ?? []) as Array<any>
  const rows = useMemo(() => (orders.data ?? []) as Array<any>, [orders.data])

  const onCreate = async () => {
    if (!form.supplierId || !form.warehouseId) return
    const created = await createOrder.mutateAsync({
      supplierId: form.supplierId,
      warehouseId: form.warehouseId,
      expectedDate: form.expectedDate || undefined,
      note: form.note || undefined
    })
    setShowForm(false)
    setForm({ supplierId: '', warehouseId: '', expectedDate: '', note: '' })
    navigate(`/scm/orders/${created.id}`)
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Поръчки покупка"
        subtitle="Управление на поръчки към доставчици"
        help={{
          title: 'Поръчки покупка',
          content:
            'Управление на поръчките към доставчици. Статуси: Чернова → Изпратена → Получена. При получаване можете да създадете доставка.'
        }}
        action={!showForm ? <Button onClick={() => setShowForm(true)}>Нова поръчка</Button> : undefined}
      />

      {showForm ? (
        <Card style={{ marginBottom: 20 }}>
          <FormRow columns={4}>
            <FormField label="Доставчик" required>
              <Select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                <option value="">Изберете доставчик</option>
                {supplierOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Склад" required>
              <WarehouseSelector value={form.warehouseId} onChange={(warehouseId) => setForm({ ...form, warehouseId })} />
            </FormField>
            <FormField label="Очаквана дата">
              <Input type="date" value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} />
            </FormField>
            <FormField label="Бележка">
              <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="По избор" />
            </FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Отказ
            </Button>
            <Button onClick={onCreate} disabled={createOrder.isPending}>
              {createOrder.isPending ? 'Запис...' : 'Създай'}
            </Button>
          </div>
        </Card>
      ) : null}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Номер</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Доставчик</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Склад</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Статус</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Очаквана дата</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const st = poStatusMap[o.status] ?? { label: o.status, bg: '#f3f4f6', color: '#374151' }
              return (
                <tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }}>{o.orderNo}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{o.supplier?.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{o.warehouse?.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge label={st.label} bg={st.bg} color={st.color} />
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{o.expectedDate ? new Date(o.expectedDate).toLocaleDateString('bg-BG') : '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/scm/orders/${o.id}`)}>
                      Преглед
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
