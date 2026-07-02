import { useParams } from 'react-router-dom'
import { Button, Card, PageHeader, StatusBadge } from '../../../components/ui'
import { formatCurrency } from '../../../lib/currency'
import { downloadPosInvoicePdf, useCancelPosInvoice, usePosInvoice } from '../hooks/usePos'

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  ISSUED: { label: 'Издадена', color: '#059669', bg: '#ecfdf5' },
  CANCELLED: { label: 'Анулирана', color: '#dc2626', bg: '#fef2f2' }
}

export default function PosInvoiceDetail() {
  const { id = '' } = useParams()
  const invoiceQuery = usePosInvoice(id)
  const cancelInvoice = useCancelPosInvoice()
  const invoice = invoiceQuery.data as any

  if (invoiceQuery.isLoading) return <div style={{ padding: 32 }}>Зареждане...</div>
  if (!invoice) return <div style={{ padding: 32 }}>Фактурата не е намерена</div>

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000 }}>
      <PageHeader
        title={`Фактура № ${invoice.number}`}
        subtitle={`Продажба ${invoice.sale?.saleNo ?? ''}`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => downloadPosInvoicePdf(invoice.id, invoice.number)}>Изтегли PDF</Button>
            {invoice.status === 'ISSUED' ? (
              <Button
                variant="danger"
                onClick={() => cancelInvoice.mutate(invoice.id)}
                disabled={cancelInvoice.isPending}
              >
                Анулирай
              </Button>
            ) : null}
          </div>
        }
      />

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <StatusBadge
            label={statusMap[invoice.status]?.label ?? invoice.status}
            color={statusMap[invoice.status]?.color ?? '#6b7280'}
            bg={statusMap[invoice.status]?.bg ?? '#f3f4f6'}
          />
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            {new Date(invoice.issueDate).toLocaleDateString('bg-BG')}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Получател</div>
            <div>{invoice.customer?.name}</div>
            <div>ЕИК: {invoice.customer?.eik || '—'}</div>
            <div>ДДС: {invoice.customer?.vatNumber || '—'}</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Дати</div>
            <div>Издаване: {new Date(invoice.issueDate).toLocaleDateString('bg-BG')}</div>
            <div>Данъчно събитие: {new Date(invoice.taxEventDate ?? invoice.issueDate).toLocaleDateString('bg-BG')}</div>
            <div>Падеж: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('bg-BG') : '—'}</div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <thead>
            <tr>
              {['Описание', 'Кол.', 'Ед. цена', 'Сума'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontSize: 11 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(invoice.sale?.lines ?? []).map((line: any) => (
              <tr key={line.id}>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>
                  {line.product?.code} — {line.product?.name}
                </td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>{line.quantity}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>{formatCurrency(line.unitPrice)}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>{formatCurrency(line.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ textAlign: 'right', fontSize: 14 }}>
          <div>Данъчна основа: {formatCurrency(invoice.subtotal)}</div>
          <div>ДДС ({invoice.vatRate}%): {formatCurrency(invoice.vatAmount)}</div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Общо: {formatCurrency(invoice.totalAmount)}</div>
        </div>
        {invoice.note ? <div style={{ marginTop: 16, color: '#6b7280' }}>Бележка: {invoice.note}</div> : null}
      </Card>
    </div>
  )
}
