import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { useStock } from '../../wms/hooks/useWms'
import { useBoms, useCreateBom } from '../hooks/useMes'

export default function BomList() {
  const boms = useBoms()
  const createBom = useCreateBom()
  const stock = useStock()
  const [showForm, setShowForm] = useState(false)
  const [productId, setProductId] = useState('')
  const products = Array.from(new Map(((stock.data ?? []) as Array<any>).map((r) => [r.product.id, r.product])).values())

  const onCreate = async () => {
    if (!productId) return
    await createBom.mutateAsync({ productId, version: '1.0' })
    setProductId('')
    setShowForm(false)
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Рецептури (BOM)</div>
        <Button onClick={() => setShowForm((x) => !x)}>{showForm ? 'Отказ' : 'Нова рецептура'}</Button>
      </div>
      {showForm ? (
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} style={{ padding: 8, minWidth: 260 }}>
            <option value="">Изберете продукт</option>
            {products.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
          <Button onClick={onCreate}>Създай</Button>
        </div>
      ) : null}
      <div style={{ marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 10 }}>Продукт</th>
              <th style={{ padding: 10 }}>Код</th>
              <th style={{ padding: 10 }}>Версия</th>
              <th style={{ padding: 10 }}>Брой компоненти</th>
              <th style={{ padding: 10 }}>Статус</th>
              <th style={{ padding: 10 }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {((boms.data ?? []) as Array<any>).map((b) => (
              <tr key={b.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: 10 }}>{b.product?.name}</td>
                <td style={{ padding: 10, fontFamily: 'monospace' }}>{b.product?.code}</td>
                <td style={{ padding: 10 }}>{b.version}</td>
                <td style={{ padding: 10 }}>{b.items?.length ?? 0}</td>
                <td style={{ padding: 10 }}>{b.isActive ? 'Активна' : 'Неактивна'}</td>
                <td style={{ padding: 10 }}>
                  <Link to={`/mes/bom/${b.productId}`}>Преглед</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

