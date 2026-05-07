import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
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
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Доставки</div>
        <Button onClick={() => setShowForm((x) => !x)}>{showForm ? 'Отказ' : 'Нова доставка'}</Button>
      </div>

      {showForm ? (
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
          <select value={form.purchaseOrderId} onChange={(e) => setForm({ ...form, purchaseOrderId: e.target.value })} style={{ padding: 8 }}>
            <option value="">Без поръчка</option>
            {orderOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orderNo}
              </option>
            ))}
          </select>
          <WarehouseSelector value={form.warehouseId} onChange={(warehouseId) => setForm({ ...form, warehouseId })} />
          <input placeholder="Доставчик" value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} style={{ padding: 8 }} />
          <input type="date" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} style={{ padding: 8 }} />
          <Button onClick={onCreate} disabled={createDelivery.isPending}>
            Създай
          </Button>
        </div>
      ) : null}

      <div style={{ marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 10 }}>Номер</th>
              <th style={{ padding: 10 }}>Поръчка</th>
              <th style={{ padding: 10 }}>Доставчик</th>
              <th style={{ padding: 10 }}>Склад</th>
              <th style={{ padding: 10 }}>Статус</th>
              <th style={{ padding: 10 }}>Дата</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }} onClick={() => navigate(`/scm/deliveries/${d.id}`)}>
                <td style={{ padding: 10, fontFamily: 'monospace' }}>{d.deliveryNo}</td>
                <td style={{ padding: 10 }}>{d.purchaseOrder?.orderNo ?? '—'}</td>
                <td style={{ padding: 10 }}>{d.supplierName ?? '—'}</td>
                <td style={{ padding: 10 }}>{d.warehouse?.name ?? '—'}</td>
                <td style={{ padding: 10 }}>
                  <span
                    style={{
                      padding: '2px 10px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 500,
                      background: (deliveryStatusMap[d.status] ?? { bg: '#f3f4f6' }).bg,
                      color: (deliveryStatusMap[d.status] ?? { color: '#374151' }).color
                    }}
                  >
                    {(deliveryStatusMap[d.status] ?? { label: d.status }).label}
                  </span>
                </td>
                <td style={{ padding: 10 }}>{d.createdAt ? new Date(d.createdAt).toLocaleString('bg-BG') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

