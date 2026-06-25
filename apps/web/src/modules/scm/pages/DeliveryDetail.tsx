import { useEffect, useMemo, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { BackButton, Button, Input, PageHeader, Select, StatusBadge } from '../../../components/ui'
import { useReceipt, useStock, useWarehouseLocations } from '../../wms/hooks/useWms'
import {
  useAddDeliveryLine,
  useConfirmDelivery,
  useDeleteDeliveryLine,
  useDelivery,
  useUpdateDeliveryLine
} from '../hooks/useScm'

const deliveryStatusMap: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: 'Чернова', bg: '#fef9c3', color: '#854d0e' },
  CONFIRMED: { label: 'Потвърдена', bg: '#dcfce7', color: '#166534' },
  CANCELLED: { label: 'Анулирана', bg: '#fee2e2', color: '#991b1b' }
}

const thStyle: React.CSSProperties = {
  padding: '11px 16px',
  fontSize: 12,
  fontWeight: 600,
  color: '#6b7280',
  textAlign: 'left'
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 13
}

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#9ca3af',
  padding: 4,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4
}

function resolveDefaultLocationId(locs: Array<{ id: string; locationType?: string }>): string {
  if (locs.length === 1) return locs[0].id
  const receiving = locs.find((l) => l.locationType === 'RECEIVING')
  return receiving?.id ?? ''
}

export default function DeliveryDetail() {
  const { id = '' } = useParams()
  const deliveryQuery = useDelivery(id)
  const addLine = useAddDeliveryLine()
  const updateLine = useUpdateDeliveryLine()
  const deleteLine = useDeleteDeliveryLine()
  const confirm = useConfirmDelivery()
  const delivery = deliveryQuery.data as any
  const locations = useWarehouseLocations(delivery?.warehouseId)
  const stock = useStock(delivery?.warehouseId)
  const linkedReceiptQuery = useReceipt(delivery?.goodsReceiptId ?? '')

  const products = useMemo(() => {
    const rows = (stock.data ?? []) as Array<any>
    const m = new Map<string, any>()
    rows.forEach((r) => m.set(r.product.id, r.product))
    return Array.from(m.values())
  }, [stock.data])

  const warehouseLocations = useMemo(
    () => (locations.data ?? []) as Array<{ id: string; code: string; name: string; locationType?: string }>,
    [locations.data]
  )

  const defaultLocationId = useMemo(() => resolveDefaultLocationId(warehouseLocations), [warehouseLocations])

  const availableProducts = useMemo(() => {
    if (!delivery?.purchaseOrderId || !delivery?.purchaseOrder?.lines?.length) return products
    const poProductIds = new Set(delivery.purchaseOrder.lines.map((l: any) => l.productId))
    return products.filter((p) => poProductIds.has(p.id))
  }, [delivery?.purchaseOrderId, delivery?.purchaseOrder?.lines, products])

  const poLineByProductId = useMemo(() => {
    const map = new Map<string, any>()
    for (const pl of delivery?.purchaseOrder?.lines ?? []) {
      map.set(pl.productId, pl)
    }
    return map
  }, [delivery?.purchaseOrder?.lines])

  const [line, setLine] = useState({ productId: '', locationId: '', quantity: 1, lotNumber: '' })
  const [confirmedReceipt, setConfirmedReceipt] = useState<{ id: string; no: string } | null>(null)
  const [isFilling, setIsFilling] = useState(false)
  const [editingLineId, setEditingLineId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ locationId: '', quantity: 1, lotNumber: '' })

  useEffect(() => {
    if (defaultLocationId && !line.locationId) {
      setLine((prev) => ({ ...prev, locationId: defaultLocationId }))
    }
  }, [defaultLocationId, line.locationId])

  const receiptInfo = useMemo(() => {
    if (confirmedReceipt) return confirmedReceipt
    if (delivery?.goodsReceiptId && linkedReceiptQuery.data) {
      return {
        id: delivery.goodsReceiptId,
        no: (linkedReceiptQuery.data as any).receiptNo
      }
    }
    return null
  }, [confirmedReceipt, delivery?.goodsReceiptId, linkedReceiptQuery.data])

  const status = deliveryStatusMap[delivery?.status] ?? {
    label: delivery?.status ?? '—',
    bg: '#f3f4f6',
    color: '#374151'
  }

  const handleProductChange = (productId: string) => {
    const poLine = poLineByProductId.get(productId)
    setLine((prev) => ({
      ...prev,
      productId,
      quantity: poLine ? poLine.quantity : 1
    }))
  }

  const onAdd = async () => {
    if (!line.productId || !line.locationId || !line.quantity) return
    await addLine.mutateAsync({
      id,
      productId: line.productId,
      locationId: line.locationId,
      quantity: Number(line.quantity),
      lotNumber: line.lotNumber || undefined
    })
    setLine({ productId: '', locationId: defaultLocationId, quantity: 1, lotNumber: '' })
  }

  const fillFromPurchaseOrder = async () => {
    const poLines = (delivery?.purchaseOrder?.lines ?? []) as Array<any>
    if (!poLines.length) return

    const existingProductIds = new Set((delivery?.lines ?? []).map((l: any) => l.productId))
    const locId = defaultLocationId
    const toAdd = poLines.filter((pl) => {
      const remaining = pl.quantity - (pl.receivedQty ?? 0)
      return remaining > 0 && !existingProductIds.has(pl.productId)
    })

    if (!toAdd.length) return
    if (!locId) return

    setIsFilling(true)
    try {
      for (const pl of toAdd) {
        const remaining = pl.quantity - (pl.receivedQty ?? 0)
        await addLine.mutateAsync({
          id,
          productId: pl.productId,
          locationId: locId,
          quantity: remaining
        })
      }
    } finally {
      setIsFilling(false)
    }
  }

  const onConfirm = async () => {
    const result = await confirm.mutateAsync(id)
    if (result?.goodsReceiptNo && result?.goodsReceiptId) {
      setConfirmedReceipt({ id: result.goodsReceiptId, no: result.goodsReceiptNo })
    }
  }

  const startEdit = (row: any) => {
    setEditingLineId(row.id)
    setEditForm({
      locationId: row.locationId,
      quantity: row.quantity,
      lotNumber: row.lotNumber ?? ''
    })
  }

  const cancelEdit = () => {
    setEditingLineId(null)
    setEditForm({ locationId: '', quantity: 1, lotNumber: '' })
  }

  const onSaveEdit = async () => {
    if (!editingLineId || !editForm.locationId || !editForm.quantity) return
    await updateLine.mutateAsync({
      deliveryId: id,
      itemId: editingLineId,
      locationId: editForm.locationId,
      quantity: Number(editForm.quantity),
      lotNumber: editForm.lotNumber || undefined
    })
    cancelEdit()
  }

  const onDeleteLine = async (itemId: string) => {
    if (!window.confirm('Изтриване на реда?')) return
    await deleteLine.mutateAsync({ deliveryId: id, itemId })
    if (editingLineId === itemId) cancelEdit()
  }

  const canFillFromPo =
    delivery?.status === 'DRAFT' &&
    Boolean(delivery?.purchaseOrderId) &&
    Boolean(delivery?.purchaseOrder?.lines?.length) &&
    Boolean(defaultLocationId)

  const isDraft = delivery?.status === 'DRAFT'
  const deliveryLines = delivery?.lines ?? []
  const colCount = isDraft ? 5 : 4

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <BackButton to="/scm/deliveries" />
      <PageHeader
        title={`Доставка ${delivery?.deliveryNo ?? ''}`}
        action={
          isDraft ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {delivery?.purchaseOrderId ? (
                <Button
                  variant="secondary"
                  onClick={fillFromPurchaseOrder}
                  disabled={!canFillFromPo || isFilling || addLine.isPending}
                >
                  {isFilling ? 'Попълване...' : 'Попълни от поръчката'}
                </Button>
              ) : null}
              <Button onClick={onConfirm} disabled={confirm.isPending || deliveryLines.length === 0}>
                {confirm.isPending ? 'Потвърждаване...' : 'Потвърди доставка'}
              </Button>
            </div>
          ) : undefined
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
          fontSize: 13
        }}
      >
        <div>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Поръчка: </span>
          {delivery?.purchaseOrder ? (
            <Link
              to={`/scm/orders/${delivery.purchaseOrder.id}`}
              style={{ color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}
            >
              {delivery.purchaseOrder.orderNo}
            </Link>
          ) : (
            <span>—</span>
          )}
        </div>
        <div>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Доставчик: </span>
          <span>{delivery?.purchaseOrder?.supplier?.name ?? delivery?.supplierName ?? '—'}</span>
        </div>
        <div>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Склад: </span>
          <span>
            {delivery?.warehouse ? `${delivery.warehouse.code} — ${delivery.warehouse.name}` : '—'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Статус: </span>
          <StatusBadge label={status.label} bg={status.bg} color={status.color} />
        </div>
      </div>

      {receiptInfo ? (
        <div
          style={{
            marginBottom: 16,
            padding: '14px 16px',
            border: '1px solid #86efac',
            borderRadius: 10,
            background: '#f0fdf4',
            color: '#166534',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          ✅ Създадена приходна бележка:{' '}
          <Link
            to={`/wms/receipts/${receiptInfo.id}`}
            style={{ color: '#15803d', fontWeight: 700, textDecoration: 'underline' }}
          >
            {receiptInfo.no}
          </Link>
        </div>
      ) : null}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
              <th style={thStyle}>Продукт</th>
              <th style={thStyle}>Локация</th>
              <th style={thStyle}>Количество</th>
              <th style={thStyle}>Партида</th>
              {isDraft ? <th style={{ ...thStyle, width: 88 }} /> : null}
            </tr>
          </thead>
          <tbody>
            {deliveryQuery.isLoading ? (
              <tr>
                <td colSpan={colCount} style={{ ...tdStyle, color: '#6b7280', textAlign: 'center' }}>
                  Зареждане...
                </td>
              </tr>
            ) : deliveryLines.length === 0 && !isDraft ? (
              <tr>
                <td colSpan={colCount} style={{ ...tdStyle, color: '#6b7280', textAlign: 'center' }}>
                  Няма редове
                </td>
              </tr>
            ) : (
              deliveryLines.map((l: any) => {
                const isEditing = editingLineId === l.id

                if (isEditing) {
                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
                      <td style={{ ...tdStyle, color: '#374151' }}>
                        {l.product ? `${l.product.code} — ${l.product.name}` : l.productId}
                      </td>
                      <td style={tdStyle}>
                        <Select
                          value={editForm.locationId}
                          onChange={(e) => setEditForm({ ...editForm, locationId: e.target.value })}
                        >
                          <option value="">Изберете локация</option>
                          {warehouseLocations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.code} — {loc.name}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td style={tdStyle}>
                        <Input
                          type="number"
                          min={0}
                          value={editForm.quantity}
                          onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                        />
                      </td>
                      <td style={tdStyle}>
                        <Input
                          placeholder="Партида"
                          value={editForm.lotNumber}
                          onChange={(e) => setEditForm({ ...editForm, lotNumber: e.target.value })}
                        />
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <Button
                            size="sm"
                            onClick={onSaveEdit}
                            disabled={updateLine.isPending || !editForm.locationId || !editForm.quantity}
                          >
                            {updateLine.isPending ? '...' : 'Запази'}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={updateLine.isPending}>
                            Отказ
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={tdStyle}>
                      {l.product ? `${l.product.code} — ${l.product.name}` : l.productId}
                    </td>
                    <td style={tdStyle}>
                      {l.location ? `${l.location.code} — ${l.location.name}` : l.locationId}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{l.quantity}</td>
                    <td style={tdStyle}>{l.lotNumber ?? '—'}</td>
                    {isDraft ? (
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <button
                            type="button"
                            title="Редактирай"
                            style={iconBtnStyle}
                            onClick={() => startEdit(l)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#2563eb'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#9ca3af'
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            title="Изтрий"
                            style={iconBtnStyle}
                            onClick={() => onDeleteLine(l.id)}
                            disabled={deleteLine.isPending}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#ef4444'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#9ca3af'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                )
              })
            )}
          </tbody>
          {isDraft ? (
            <tfoot>
              <tr style={{ borderTop: '1px solid #e5e7eb', background: '#fafafa' }}>
                <td style={{ ...tdStyle, verticalAlign: 'middle' }}>
                  <Select value={line.productId} onChange={(e) => handleProductChange(e.target.value)}>
                    <option value="">Изберете продукт</option>
                    {availableProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </Select>
                </td>
                <td style={{ ...tdStyle, verticalAlign: 'middle' }}>
                  <Select
                    value={line.locationId}
                    onChange={(e) => setLine({ ...line, locationId: e.target.value })}
                  >
                    <option value="">{locations.isLoading ? 'Зареждане...' : 'Изберете локация'}</option>
                    {warehouseLocations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.code} — {l.name}
                      </option>
                    ))}
                  </Select>
                </td>
                <td style={{ ...tdStyle, verticalAlign: 'middle' }}>
                  <Input
                    type="number"
                    min={0}
                    value={line.quantity}
                    onChange={(e) => setLine({ ...line, quantity: Number(e.target.value) })}
                  />
                </td>
                <td style={{ ...tdStyle, verticalAlign: 'middle' }}>
                  <Input
                    placeholder="Партида"
                    value={line.lotNumber}
                    onChange={(e) => setLine({ ...line, lotNumber: e.target.value })}
                  />
                </td>
                <td style={{ ...tdStyle, verticalAlign: 'middle' }}>
                  <Button onClick={onAdd} disabled={addLine.isPending || !line.productId || !line.locationId}>
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
