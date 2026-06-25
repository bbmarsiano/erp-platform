import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { BackButton, Button, Input, PageHeader, Select, StatusBadge } from '../../../components/ui'
import { api } from '../../../lib/api'
import { formatCurrency } from '../../../lib/currency'
import {
  useAddPurchaseOrderLine,
  useCreateDelivery,
  usePurchaseOrder,
  useSendPurchaseOrder
} from '../hooks/useScm'
import { poStatusMap, poTableRowStyle, poTableTdStyle, poTableThStyle } from '../poUi'

type ProductOption = { id: string; code: string; name: string; price?: number | null; unit?: string }

function lineSum(quantity: number, unitPrice?: number | null): number {
  return quantity * (unitPrice ?? 0)
}

export default function PurchaseOrderDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const orderQuery = usePurchaseOrder(id)
  const addLine = useAddPurchaseOrderLine()
  const sendOrder = useSendPurchaseOrder()
  const createDelivery = useCreateDelivery()
  const order = orderQuery.data as any

  const productsQuery = useQuery({
    queryKey: ['wms', 'products'],
    queryFn: () => api.get('/api/wms/products').then((r) => r.data.data as ProductOption[])
  })
  const products = (productsQuery.data ?? []).filter((p: any) => p.isActive !== false)

  const [line, setLine] = useState({ productId: '', quantity: 1, unitPrice: 0 })

  const status = poStatusMap[order?.status] ?? {
    label: order?.status ?? '—',
    bg: '#f3f4f6',
    color: '#374151'
  }

  const orderLines = order?.lines ?? []
  const totalSum = useMemo(
    () => orderLines.reduce((sum: number, l: any) => sum + lineSum(l.quantity, l.unitPrice), 0),
    [orderLines]
  )

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    setLine((prev) => ({
      ...prev,
      productId,
      unitPrice: product?.price != null ? Number(product.price) : 0
    }))
  }

  const onAdd = async () => {
    if (!line.productId || !line.quantity) return
    await addLine.mutateAsync({
      id,
      productId: line.productId,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice) || undefined
    })
    setLine({ productId: '', quantity: 1, unitPrice: 0 })
  }

  const onCreateDelivery = async () => {
    if (!order?.warehouseId) return
    const created = await createDelivery.mutateAsync({
      purchaseOrderId: id,
      warehouseId: order.warehouseId,
      supplierName: order.supplier?.name
    })
    navigate(`/scm/deliveries/${created.id}`)
  }

  const canCreateDelivery = order?.status === 'SENT' || order?.status === 'PARTIALLY_RECEIVED'
  const isDraft = order?.status === 'DRAFT'

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <BackButton to="/scm/orders" />
      <PageHeader
        title={`Поръчка покупка ${order?.orderNo ?? ''}`}
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {canCreateDelivery ? (
              <Button onClick={onCreateDelivery} disabled={createDelivery.isPending}>
                {createDelivery.isPending ? 'Създаване...' : 'Създай доставка'}
              </Button>
            ) : null}
            {isDraft ? (
              <Button onClick={() => sendOrder.mutate(id)} disabled={sendOrder.isPending}>
                {sendOrder.isPending ? 'Изпращане...' : 'Изпрати'}
              </Button>
            ) : null}
          </div>
        }
      />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px 28px',
          marginTop: 4,
          marginBottom: 16,
          padding: '14px 16px',
          background: '#f8fafc',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          fontSize: 14
        }}
      >
        <div>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Доставчик: </span>
          <span>{order?.supplier?.name ?? '—'}</span>
        </div>
        <div>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Склад: </span>
          <span>{order?.warehouse ? `${order.warehouse.code} — ${order.warehouse.name}` : '—'}</span>
        </div>
        <div>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Очаквана дата: </span>
          <span>
            {order?.expectedDate ? new Date(order.expectedDate).toLocaleDateString('bg-BG') : '—'}
          </span>
        </div>
        <div>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Бележка: </span>
          <span>{order?.note ?? '—'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Статус: </span>
          <StatusBadge label={status.label} bg={status.bg} color={status.color} />
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <th style={poTableThStyle}>Продукт</th>
              <th style={poTableThStyle}>Количество</th>
              <th style={poTableThStyle}>Цена</th>
              <th style={{ ...poTableThStyle, textAlign: 'right' }}>Сума</th>
            </tr>
          </thead>
          <tbody>
            {orderQuery.isLoading ? (
              <tr>
                <td colSpan={4} style={{ ...poTableTdStyle, color: '#6b7280', textAlign: 'center' }}>
                  Зареждане...
                </td>
              </tr>
            ) : orderLines.length === 0 && !isDraft ? (
              <tr>
                <td colSpan={4} style={{ ...poTableTdStyle, color: '#6b7280', textAlign: 'center' }}>
                  Няма редове
                </td>
              </tr>
            ) : (
              orderLines.map((l: any) => (
                <tr
                  key={l.id}
                  style={poTableRowStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <td style={poTableTdStyle}>
                    {l.product ? `${l.product.code} — ${l.product.name}` : l.productId}
                  </td>
                  <td style={poTableTdStyle}>{l.quantity}</td>
                  <td style={poTableTdStyle}>{l.unitPrice != null ? formatCurrency(l.unitPrice) : '—'}</td>
                  <td style={{ ...poTableTdStyle, textAlign: 'right', fontWeight: 600 }}>
                    {l.unitPrice != null ? formatCurrency(lineSum(l.quantity, l.unitPrice)) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {orderLines.length > 0 ? (
            <tfoot>
              <tr style={{ borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <td colSpan={3} style={{ ...poTableTdStyle, fontWeight: 700, textAlign: 'right' }}>
                  Общо:
                </td>
                <td style={{ ...poTableTdStyle, textAlign: 'right', fontWeight: 700 }}>
                  {formatCurrency(totalSum)}
                </td>
              </tr>
            </tfoot>
          ) : null}
          {isDraft ? (
            <tfoot>
              <tr style={{ borderTop: '1px solid #e5e7eb', background: '#fafafa' }}>
                <td style={{ ...poTableTdStyle, verticalAlign: 'middle' }}>
                  <Select value={line.productId} onChange={(e) => handleProductChange(e.target.value)}>
                    <option value="">Изберете продукт</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </Select>
                </td>
                <td style={{ ...poTableTdStyle, verticalAlign: 'middle' }}>
                  <Input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => setLine({ ...line, quantity: Number(e.target.value) })}
                  />
                </td>
                <td style={{ ...poTableTdStyle, verticalAlign: 'middle' }}>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(e) => setLine({ ...line, unitPrice: Number(e.target.value) })}
                  />
                </td>
                <td style={{ ...poTableTdStyle, verticalAlign: 'middle', textAlign: 'right' }}>
                  <Button onClick={onAdd} disabled={addLine.isPending || !line.productId || !line.quantity}>
                    {addLine.isPending ? '...' : 'Добави ред'}
                  </Button>
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  )
}
