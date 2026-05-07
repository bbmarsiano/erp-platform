import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
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
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Поръчки покупка</div>
        <Button onClick={() => setShowForm((x) => !x)}>{showForm ? 'Отказ' : 'Нова поръчка'}</Button>
      </div>

      {showForm ? (
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
          <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} style={{ padding: 8 }}>
            <option value="">Изберете доставчик</option>
            {supplierOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
          <WarehouseSelector value={form.warehouseId} onChange={(warehouseId) => setForm({ ...form, warehouseId })} />
          <input type="date" value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} style={{ padding: 8 }} />
          <input placeholder="Бележка" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} style={{ padding: 8 }} />
          <Button onClick={onCreate} disabled={createOrder.isPending}>
            {createOrder.isPending ? 'Запис...' : 'Създай'}
          </Button>
        </div>
      ) : null}

      <div style={{ marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 10 }}>Номер</th>
              <th style={{ padding: 10 }}>Доставчик</th>
              <th style={{ padding: 10 }}>Склад</th>
              <th style={{ padding: 10 }}>Статус</th>
              <th style={{ padding: 10 }}>Очаквана дата</th>
              <th style={{ padding: 10 }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: 10, fontFamily: 'monospace' }}>{o.orderNo}</td>
                <td style={{ padding: 10 }}>{o.supplier?.name}</td>
                <td style={{ padding: 10 }}>{o.warehouse?.name}</td>
                <td style={{ padding: 10 }}>
                  <span
                    style={{
                      padding: '2px 10px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 500,
                      background: (poStatusMap[o.status] ?? { bg: '#f3f4f6' }).bg,
                      color: (poStatusMap[o.status] ?? { color: '#374151' }).color
                    }}
                  >
                    {(poStatusMap[o.status] ?? { label: o.status }).label}
                  </span>
                </td>
                <td style={{ padding: 10 }}>{o.expectedDate ? new Date(o.expectedDate).toLocaleDateString('bg-BG') : '—'}</td>
                <td style={{ padding: 10 }}>
                  <Button onClick={() => navigate(`/scm/orders/${o.id}`)} style={{ background: '#fff', color: '#111', border: '1px solid #ddd' }}>
                    Преглед
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

