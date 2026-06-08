import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, PageHeader } from '../../../components/ui'
import { useStock } from '../../wms/hooks/useWms'
import { useAddBomItem, useBom } from '../hooks/useMes'

export default function BomDetail() {
  const { productId = '' } = useParams()
  const bomQuery = useBom(productId)
  const addItem = useAddBomItem()
  const stock = useStock()
  const products = Array.from(new Map(((stock.data ?? []) as Array<any>).map((r) => [r.product.id, r.product])).values())
  const [form, setForm] = useState({ componentId: '', quantity: 1, unit: '', note: '' })

  const bom = bomQuery.data as any

  const onAdd = async () => {
    if (!bom?.id || !form.componentId || !form.quantity) return
    await addItem.mutateAsync({
      id: bom.id,
      componentId: form.componentId,
      quantity: Number(form.quantity),
      unit: form.unit || undefined,
      note: form.note || undefined
    })
    setForm({ componentId: '', quantity: 1, unit: '', note: '' })
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader title={`Рецептура: ${bom?.product?.name ?? ''}`} />
      <div style={{ marginTop: 8, color: '#6b7280' }}>
        <Link to="/mes/bom">← Назад</Link>
      </div>

      <div style={{ marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 8 }}>Компонент</th>
              <th style={{ padding: 8 }}>Код</th>
              <th style={{ padding: 8 }}>Количество</th>
              <th style={{ padding: 8 }}>М.Е.</th>
              <th style={{ padding: 8 }}>Бележка</th>
            </tr>
          </thead>
          <tbody>
            {(bom?.items ?? []).map((i: any) => (
              <tr key={i.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: 8 }}>{i.component?.name}</td>
                <td style={{ padding: 8, fontFamily: 'monospace' }}>{i.component?.code}</td>
                <td style={{ padding: 8 }}>{i.quantity}</td>
                <td style={{ padding: 8 }}>{i.unit ?? i.component?.unit ?? '—'}</td>
                <td style={{ padding: 8 }}>{i.note ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 120px 100px 1fr auto', gap: 8, alignItems: 'end' }}>
          <select value={form.componentId} onChange={(e) => setForm({ ...form, componentId: e.target.value })} style={{ padding: 8 }}>
            <option value="">Изберете компонент</option>
            {products.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
          <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} style={{ padding: 8 }} />
          <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="М.Е." style={{ padding: 8 }} />
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Бележка" style={{ padding: 8 }} />
          <Button onClick={onAdd}>Добави компонент</Button>
        </div>
      </div>
    </div>
  )
}

