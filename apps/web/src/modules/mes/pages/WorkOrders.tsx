import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { WarehouseSelector } from '../../wms/components/WarehouseSelector'
import { useWarehouseLocations } from '../../wms/hooks/useWms'
import { useBoms, useCreateWorkOrder, useWorkOrders } from '../hooks/useMes'

const woStatusMap: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: 'Чернова', bg: '#fef9c3', color: '#854d0e' },
  RELEASED: { label: 'Пуснато', bg: '#dbeafe', color: '#1e40af' },
  IN_PROGRESS: { label: 'В изпълнение', bg: '#fed7aa', color: '#9a3412' },
  COMPLETED: { label: 'Завършено', bg: '#dcfce7', color: '#166534' },
  CANCELLED: { label: 'Анулирано', bg: '#fee2e2', color: '#991b1b' }
}

export default function WorkOrders() {
  const navigate = useNavigate()
  const orders = useWorkOrders()
  const boms = useBoms()
  const createOrder = useCreateWorkOrder()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ productId: '', bomId: '', warehouseId: '', outputLocationId: '', plannedQty: 1, note: '' })
  const locations = useWarehouseLocations(form.warehouseId)
  const bomList = (boms.data ?? []) as Array<any>

  const onCreate = async () => {
    if (!form.productId || !form.warehouseId || !form.outputLocationId) return
    const created = await createOrder.mutateAsync({
      productId: form.productId,
      bomId: form.bomId || undefined,
      warehouseId: form.warehouseId,
      outputLocationId: form.outputLocationId,
      plannedQty: Number(form.plannedQty),
      note: form.note || undefined
    })
    setShowForm(false)
    navigate(`/mes/orders/${created.id}`)
  }

  const rows = useMemo(() => (orders.data ?? []) as Array<any>, [orders.data])

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Производствени нареждания</div>
        <Button onClick={() => setShowForm((x) => !x)}>{showForm ? 'Отказ' : 'Ново нареждане'}</Button>
      </div>
      {showForm ? (
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 120px 1fr auto', gap: 8, alignItems: 'end' }}>
          <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} style={{ padding: 8 }}>
            <option value="">Краен продукт</option>
            {bomList.map((b) => (
              <option key={b.productId} value={b.productId}>
                {b.product?.code} — {b.product?.name}
              </option>
            ))}
          </select>
          <select value={form.bomId} onChange={(e) => setForm({ ...form, bomId: e.target.value })} style={{ padding: 8 }}>
            <option value="">BOM (по избор)</option>
            {bomList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.product?.code} v{b.version}
              </option>
            ))}
          </select>
          <WarehouseSelector value={form.warehouseId} onChange={(warehouseId) => setForm({ ...form, warehouseId })} />
          <select value={form.outputLocationId} onChange={(e) => setForm({ ...form, outputLocationId: e.target.value })} style={{ padding: 8 }}>
            <option value="">Изходна локация</option>
            {((locations.data ?? []) as Array<any>).map((l) => (
              <option key={l.id} value={l.id}>
                {l.code}
              </option>
            ))}
          </select>
          <input type="number" value={form.plannedQty} onChange={(e) => setForm({ ...form, plannedQty: Number(e.target.value) })} style={{ padding: 8 }} />
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Бележка" style={{ padding: 8 }} />
          <Button onClick={onCreate}>Създай</Button>
        </div>
      ) : null}

      <div style={{ marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 10 }}>Номер</th>
              <th style={{ padding: 10 }}>Продукт</th>
              <th style={{ padding: 10 }}>Планирано кол.</th>
              <th style={{ padding: 10 }}>Статус</th>
              <th style={{ padding: 10 }}>Начало</th>
              <th style={{ padding: 10 }}>Край</th>
              <th style={{ padding: 10 }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((wo) => (
              <tr key={wo.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: 10, fontFamily: 'monospace' }}>{wo.orderNo}</td>
                <td style={{ padding: 10 }}>{wo.product?.name}</td>
                <td style={{ padding: 10 }}>{wo.plannedQty}</td>
                <td style={{ padding: 10 }}>
                  <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: woStatusMap[wo.status]?.bg, color: woStatusMap[wo.status]?.color }}>
                    {woStatusMap[wo.status]?.label ?? wo.status}
                  </span>
                </td>
                <td style={{ padding: 10 }}>{wo.actualStart ? new Date(wo.actualStart).toLocaleString('bg-BG') : '—'}</td>
                <td style={{ padding: 10 }}>{wo.actualEnd ? new Date(wo.actualEnd).toLocaleString('bg-BG') : '—'}</td>
                <td style={{ padding: 10 }}>
                  <Button onClick={() => navigate(`/mes/orders/${wo.id}`)} style={{ background: '#fff', color: '#111', border: '1px solid #ddd' }}>
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

