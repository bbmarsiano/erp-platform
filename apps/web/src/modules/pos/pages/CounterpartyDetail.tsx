import { useParams } from 'react-router-dom'
import { Button, Card, PageHeader } from '../../../components/ui'
import { formatCurrency } from '../../../lib/currency'
import { useCounterparty } from '../hooks/usePos'

export default function CounterpartyDetail() {
  const { id = '' } = useParams()
  const counterparty = useCounterparty(id)
  const data = counterparty.data as any

  if (counterparty.isLoading) return <div style={{ padding: 32 }}>Зареждане...</div>
  if (!data) return <div style={{ padding: 32 }}>Контрагентът не е намерен</div>

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      <PageHeader title={data.name} subtitle={`Контрагент ${data.code}`} />

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
          <div><strong>ЕИК:</strong> {data.eik || '—'}</div>
          <div><strong>ДДС номер:</strong> {data.vatNumber || '—'}</div>
          <div><strong>Адрес:</strong> {[data.address, data.city].filter(Boolean).join(', ') || '—'}</div>
          <div><strong>МОЛ:</strong> {data.contactPerson || '—'}</div>
          <div><strong>Телефон:</strong> {data.phone || '—'}</div>
          <div><strong>Имейл:</strong> {data.email || '—'}</div>
        </div>
      </Card>

      <Card>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>История на покупките</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Дата', 'Продажба №', 'Артикули', 'Сума', 'Фактура'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontSize: 11 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.purchaseHistory ?? []).map((sale: any) => (
              <tr key={sale.id}>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>
                  {new Date(sale.createdAt).toLocaleDateString('bg-BG')}
                </td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>{sale.saleNo}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>{sale.itemsCount}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>{formatCurrency(sale.totalAmount)}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>
                  {sale.posInvoice ? sale.posInvoice.number : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.purchaseHistory?.length ? (
          <div style={{ padding: 16, color: '#6b7280' }}>Няма регистрирани покупки</div>
        ) : null}
      </Card>
    </div>
  )
}
