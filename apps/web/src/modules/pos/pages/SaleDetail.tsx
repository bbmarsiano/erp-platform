import { Link, useParams } from 'react-router-dom'
import { useSale } from '../hooks/usePos'

const paymentLabels: Record<string, string> = {
  CASH: 'Кеш',
  CARD: 'Карта',
  MIXED: 'Смесено'
}

export default function SaleDetail() {
  const { id = '' } = useParams()
  const saleQuery = useSale(id)
  const sale = saleQuery.data as any
  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 900 }}>Касова бележка {sale?.saleNo ?? ''}</div>
      <div style={{ marginTop: 8 }}>
        <Link to="/pos/sales">← Назад</Link>
      </div>
      <div style={{ marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
        <div>Каса: {sale?.cashRegister?.name ?? '-'}</div>
        <div>Метод: {sale?.paymentMethod ? paymentLabels[sale.paymentMethod] ?? sale.paymentMethod : '-'}</div>
        <div>Дата: {sale?.createdAt ? new Date(sale.createdAt).toLocaleString('bg-BG') : '-'}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 8 }}>Артикул</th>
              <th style={{ padding: 8 }}>Количество</th>
              <th style={{ padding: 8 }}>Ед. цена</th>
              <th style={{ padding: 8 }}>Сума</th>
            </tr>
          </thead>
          <tbody>
            {(sale?.lines ?? []).map((l: any) => (
              <tr key={l.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: 8 }}>{l.product?.name}</td>
                <td style={{ padding: 8 }}>{l.quantity}</td>
                <td style={{ padding: 8 }}>{l.unitPrice.toFixed(2)} лв.</td>
                <td style={{ padding: 8 }}>{l.totalPrice.toFixed(2)} лв.</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 12, fontSize: 24, fontWeight: 800 }}>Общо: {sale?.totalAmount?.toFixed?.(2) ?? 0} лв.</div>
      </div>
    </div>
  )
}

