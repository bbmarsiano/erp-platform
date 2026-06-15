import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, FormField, FormRow, Input, PageHeader, Select, StatusBadge } from '../../../components/ui'
import { WarehouseSelector } from '../../wms/components/WarehouseSelector'
import { useCreateDelivery, useDeliveries, usePurchaseOrders } from '../hooks/useScm'

const deliveryStatusMap: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: 'Чернова', bg: '#fef9c3', color: '#854d0e' },
  CONFIRMED: { label: 'Потвърдена', bg: '#dcfce7', color: '#166534' },
  CANCELLED: { label: 'Анулирана', bg: '#fee2e2', color: '#991b1b' }
}

export default function Deliveries() {
  const navigate = useNavigate()
  const deliveries = useDeliveries()
  const orders = usePurchaseOrders()
  const createDelivery = useCreateDelivery()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    purchaseOrderId: '',
    warehouseId: '',
    supplierName: '',
    deliveryDate: '',
    note: ''
  })

  const rows = useMemo(() => (deliveries.data ?? []) as Array<any>, [deliveries.data])
  const orderOptions = (orders.data ?? []) as Array<any>

  const onCreate = async () => {
    if (!form.warehouseId) return
    const created = await createDelivery.mutateAsync({
      purchaseOrderId: form.purchaseOrderId || undefined,
      warehouseId: form.warehouseId,
      supplierName: form.supplierName || undefined,
      deliveryDate: form.deliveryDate || undefined,
      note: form.note || undefined
    })
    setShowForm(false)
    setForm({ purchaseOrderId: '', warehouseId: '', supplierName: '', deliveryDate: '', note: '' })
    navigate(`/scm/deliveries/${created.id}`)
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Доставки"
        subtitle="Документи за доставка на стока"
        help={{
          title: 'Доставки',
          content:
            'При получаване на стоки потвърдете количествата тук. Потвърдената доставка автоматично създава приходен документ в склада.'
        }}
        action={!showForm ? <Button onClick={() => setShowForm(true)}>Нова доставка</Button> : undefined}
      />

      {showForm ? (
        <Card style={{ marginBottom: 20 }}>
          <FormRow columns={4}>
            <FormField label="Поръчка">
              <Select value={form.purchaseOrderId} onChange={(e) => setForm({ ...form, purchaseOrderId: e.target.value })}>
                <option value="">Без поръчка</option>
                {orderOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNo}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Склад" required>
              <WarehouseSelector value={form.warehouseId} onChange={(warehouseId) => setForm({ ...form, warehouseId })} />
            </FormField>
            <FormField label="Доставчик">
              <Input value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} placeholder="Име на доставчик" />
            </FormField>
            <FormField label="Дата на доставка">
              <Input type="date" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} />
            </FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Отказ
            </Button>
            <Button onClick={onCreate} disabled={createDelivery.isPending}>
              {createDelivery.isPending ? 'Запис...' : 'Създай'}
            </Button>
          </div>
        </Card>
      ) : null}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Номер</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Поръчка</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Доставчик</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Склад</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Статус</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Дата</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const st = deliveryStatusMap[d.status] ?? { label: d.status, bg: '#f3f4f6', color: '#374151' }
              return (
                <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }} onClick={() => navigate(`/scm/deliveries/${d.id}`)}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }}>{d.deliveryNo}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{d.purchaseOrder?.orderNo ?? '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{d.supplierName ?? '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{d.warehouse?.name ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge label={st.label} bg={st.bg} color={st.color} />
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{d.createdAt ? new Date(d.createdAt).toLocaleString('bg-BG') : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
