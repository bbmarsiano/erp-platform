import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { BackButton, Button, PageHeader } from '../../../components/ui'
import { api } from '../../../lib/api'
import { formatCurrency } from '../../../lib/currency'
import { useAddPurchaseOrderLine, usePurchaseOrder, useSendPurchaseOrder } from '../hooks/useScm'

type ProductOption = { id: string; code: string; name: string; price?: number | null; unit?: string }

export default function PurchaseOrderDetail() {
  const { id = '' } = useParams()
  const orderQuery = usePurchaseOrder(id)
  const addLine = useAddPurchaseOrderLine()
  const sendOrder = useSendPurchaseOrder()
  const order = orderQuery.data as any

  const productsQuery = useQuery({
    queryKey: ['wms', 'products'],
    queryFn: () => api.get('/api/wms/products').then((r) => r.data.data as ProductOption[])
  })
  const products = (productsQuery.data ?? []).filter((p: any) => p.isActive !== false)

  const [line, setLine] = useState({ productId: '', quantity: 1, unitPrice: 0 })

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
              <th style={{ padding: 8 }}>Цена</th>
            </tr>
          </thead>
          <tbody>
            {(order?.lines ?? []).map((l: any) => (
              <tr key={l.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: 8 }}>
                  {l.product ? `${l.product.code} — ${l.product.name}` : l.productId}
                </td>
                <td style={{ padding: 8 }}>{l.quantity}</td>
                <td style={{ padding: 8 }}>{l.unitPrice != null ? formatCurrency(l.unitPrice) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {order?.status === 'DRAFT' ? (
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 120px 120px auto', gap: 8, alignItems: 'end' }}>
            <select value={line.productId} onChange={(e) => handleProductChange(e.target.value)} style={{ padding: 8 }}>
              <option value="">Изберете продукт</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={line.quantity}
              onChange={(e) => setLine({ ...line, quantity: Number(e.target.value) })}
              style={{ padding: 8 }}
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={line.unitPrice}
              onChange={(e) => setLine({ ...line, unitPrice: Number(e.target.value) })}
              style={{ padding: 8 }}
            />
            <Button onClick={onAdd} disabled={addLine.isPending || !line.productId || !line.quantity}>
              Добави ред
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
