import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BackButton, Button, PageHeader } from '../../../components/ui'
import { useStock, useWarehouseLocations } from '../../wms/hooks/useWms'
import { useAddDeliveryLine, useConfirmDelivery, useDelivery } from '../hooks/useScm'

export default function DeliveryDetail() {
  const { id = '' } = useParams()
  const deliveryQuery = useDelivery(id)
  const addLine = useAddDeliveryLine()
  const confirm = useConfirmDelivery()
  const delivery = deliveryQuery.data as any
  const locations = useWarehouseLocations(delivery?.warehouseId)
  const stock = useStock(delivery?.warehouseId)
  const products = useMemo(() => {
    const rows = (stock.data ?? []) as Array<any>
    const m = new Map<string, any>()
    rows.forEach((r) => m.set(r.product.id, r.product))
    return Array.from(m.values())
  }, [stock.data])

  const [line, setLine] = useState({ productId: '', locationId: '', quantity: 1, lotNumber: '' })
  const [lastReceipt, setLastReceipt] = useState<string | null>(null)

  const onAdd = async () => {
    if (!line.productId || !line.locationId || !line.quantity) return
    await addLine.mutateAsync({
      id,
      productId: line.productId,
      locationId: line.locationId,
      quantity: Number(line.quantity),
      lotNumber: line.lotNumber || undefined
    })
    setLine({ productId: '', locationId: '', quantity: 1, lotNumber: '' })
  }

  const onConfirm = async () => {
    const result = await confirm.mutateAsync(id)
    if (result?.goodsReceiptNo) {
      setLastReceipt(result.goodsReceiptNo)
    }
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <BackButton to="/scm/deliveries" />
      <PageHeader
        title={`Доставка ${delivery?.deliveryNo ?? ''}`}
        action={
          delivery?.status === 'DRAFT' ? (
            <Button onClick={onConfirm} disabled={confirm.isPending}>
              Потвърди доставка
            </Button>
          ) : undefined
        }
      />

      {lastReceipt ? (
        <div style={{ marginTop: 12, padding: 12, border: '1px solid #86efac', borderRadius: 10, background: '#f0fdf4', color: '#166534' }}>
          ✅ Създадена приходна бележка: {lastReceipt} <Link to="/wms/receipts">към WMS</Link>
        </div>
      ) : null}

      <div style={{ marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Редове</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 8 }}>Продукт</th>
              <th style={{ padding: 8 }}>Локация</th>
              <th style={{ padding: 8 }}>Количество</th>
              <th style={{ padding: 8 }}>Партида</th>
            </tr>
          </thead>
          <tbody>
            {(delivery?.lines ?? []).map((l: any) => (
              <tr key={l.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: 8 }}>
                  {l.product ? `${l.product.code} — ${l.product.name}` : l.productId}
                </td>
                <td style={{ padding: 8 }}>
                  {l.location ? `${l.location.code} — ${l.location.name}` : l.locationId}
                </td>
                <td style={{ padding: 8 }}>{l.quantity}</td>
                <td style={{ padding: 8 }}>{l.lotNumber ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {delivery?.status === 'DRAFT' ? (
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 120px 1fr auto', gap: 8, alignItems: 'end' }}>
            <select value={line.productId} onChange={(e) => setLine({ ...line, productId: e.target.value })} style={{ padding: 8 }}>
              <option value="">Изберете продукт</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
            <select value={line.locationId} onChange={(e) => setLine({ ...line, locationId: e.target.value })} style={{ padding: 8 }}>
              <option value="">Изберете локация</option>
              {((locations.data ?? []) as Array<any>).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} — {l.name}
                </option>
              ))}
            </select>
            <input type="number" value={line.quantity} onChange={(e) => setLine({ ...line, quantity: Number(e.target.value) })} style={{ padding: 8 }} />
            <input placeholder="Партида" value={line.lotNumber} onChange={(e) => setLine({ ...line, lotNumber: e.target.value })} style={{ padding: 8 }} />
            <Button onClick={onAdd} disabled={addLine.isPending}>
              Добави ред
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

