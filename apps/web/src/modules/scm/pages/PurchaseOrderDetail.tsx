import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BackButton, Button, PageHeader } from '../../../components/ui'
import { useStock } from '../../wms/hooks/useWms'
import { useAddPurchaseOrderLine, usePurchaseOrder, useSendPurchaseOrder } from '../hooks/useScm'

export default function PurchaseOrderDetail() {
  const { id = '' } = useParams()
  const orderQuery = usePurchaseOrder(id)
  const addLine = useAddPurchaseOrderLine()
  const sendOrder = useSendPurchaseOrder()
  const order = orderQuery.data as any
  const stock = useStock(order?.warehouseId)
  const products = useMemo(() => {
    const rows = (stock.data ?? []) as Array<any>
    const m = new Map<string, any>()
    rows.forEach((r) => m.set(r.product.id, r.product))
    return Array.from(m.values())
  }, [stock.data])
  const [line, setLine] = useState({ productId: '', quantity: 1, unitPrice: 0 })

  const onAdd = async () => {
    if (!line.productId || !line.quantity) return
    await addLine.mutateAsync({ id, productId: line.productId, quantity: Number(line.quantity), unitPrice: Number(line.unitPrice) || undefined })
    setLine({ productId: '', quantity: 1, unitPrice: 0 })
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <BackButton to="/scm/orders" />
      <PageHeader
        title={`Поръчка покупка ${order?.orderNo ?? ''}`}
        action={
          order?.status === 'DRAFT' ? (
            <Button onClick={() => sendOrder.mutate(id)} disabled={sendOrder.isPending}>
              Изпрати
            </Button>
          ) : undefined
        }
      />

      <div style={{ marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Редове</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 8 }}>Продукт</th>
              <th style={{ padding: 8 }}>Количество</th>
              <th style={{ padding: 8 }}>Получено</th>
              <th style={{ padding: 8 }}>Цена</th>
            </tr>
          </thead>
          <tbody>
            {(order?.lines ?? []).map((l: any) => (
              <tr key={l.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: 8 }}>{l.productId}</td>
                <td style={{ padding: 8 }}>{l.quantity}</td>
                <td style={{ padding: 8 }}>{l.receivedQty}</td>
                <td style={{ padding: 8 }}>{l.unitPrice ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {order?.status === 'DRAFT' ? (
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 120px 120px auto', gap: 8, alignItems: 'end' }}>
            <select value={line.productId} onChange={(e) => setLine({ ...line, productId: e.target.value })} style={{ padding: 8 }}>
              <option value="">Изберете продукт</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
            <input type="number" value={line.quantity} onChange={(e) => setLine({ ...line, quantity: Number(e.target.value) })} style={{ padding: 8 }} />
            <input type="number" value={line.unitPrice} onChange={(e) => setLine({ ...line, unitPrice: Number(e.target.value) })} style={{ padding: 8 }} />
            <Button onClick={onAdd} disabled={addLine.isPending}>
              Добави ред
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

