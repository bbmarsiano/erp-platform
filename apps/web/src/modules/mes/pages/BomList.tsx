import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, FormField, FormRow, PageHeader, Select } from '../../../components/ui'
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
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Рецептури (BOM)"
        subtitle="Управление на рецептури за производство"
        action={!showForm ? <Button onClick={() => setShowForm(true)}>Нова рецептура</Button> : undefined}
      />

      {showForm ? (
        <Card style={{ marginBottom: 20 }}>
          <FormRow columns={1}>
            <FormField label="Продукт" required>
              <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
                <option value="">Изберете продукт</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Отказ
            </Button>
            <Button onClick={onCreate} disabled={createBom.isPending}>
              {createBom.isPending ? 'Запис...' : 'Създай'}
            </Button>
          </div>
        </Card>
      ) : null}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Продукт</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Код</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Версия</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Брой компоненти</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Статус</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {((boms.data ?? []) as Array<any>).map((b) => (
              <tr key={b.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{b.product?.name}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }}>{b.product?.code}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{b.version}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{b.items?.length ?? 0}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{b.isActive ? 'Активна' : 'Неактивна'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>
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
