import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, FormField, FormRow, Input, PageHeader, Select, StatusBadge } from '../../../components/ui'
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
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Производствени нареждания"
        subtitle="Управление на производствени поръчки"
        action={!showForm ? <Button onClick={() => setShowForm(true)}>Ново нареждане</Button> : undefined}
      />

      {showForm ? (
        <Card style={{ marginBottom: 20 }}>
          <FormRow columns={3}>
            <FormField label="Краен продукт" required>
              <Select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                <option value="">Изберете продукт</option>
                {bomList.map((b) => (
                  <option key={b.productId} value={b.productId}>
                    {b.product?.code} — {b.product?.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="BOM">
              <Select value={form.bomId} onChange={(e) => setForm({ ...form, bomId: e.target.value })}>
                <option value="">BOM (по избор)</option>
                {bomList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.product?.code} v{b.version}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Склад" required>
              <WarehouseSelector value={form.warehouseId} onChange={(warehouseId) => setForm({ ...form, warehouseId })} />
            </FormField>
          </FormRow>
          <FormRow columns={3}>
            <FormField label="Изходна локация" required>
              <Select value={form.outputLocationId} onChange={(e) => setForm({ ...form, outputLocationId: e.target.value })}>
                <option value="">Изберете локация</option>
                {((locations.data ?? []) as Array<any>).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Планирано количество" required>
              <Input type="number" value={form.plannedQty} onChange={(e) => setForm({ ...form, plannedQty: Number(e.target.value) })} />
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
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Продукт</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Планирано кол.</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Статус</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Начало</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Край</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((wo) => {
              const st = woStatusMap[wo.status] ?? { label: wo.status, bg: '#f3f4f6', color: '#374151' }
              return (
                <tr key={wo.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }}>{wo.orderNo}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{wo.product?.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{wo.plannedQty}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge label={st.label} bg={st.bg} color={st.color} />
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{wo.actualStart ? new Date(wo.actualStart).toLocaleString('bg-BG') : '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{wo.actualEnd ? new Date(wo.actualEnd).toLocaleString('bg-BG') : '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/mes/orders/${wo.id}`)}>
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
