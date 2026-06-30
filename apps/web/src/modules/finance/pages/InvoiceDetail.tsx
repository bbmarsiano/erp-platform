import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { BackButton, Button, PageHeader, StatusBadge } from '../../../components/ui'
import { api } from '../../../lib/api'
import { formatCurrency } from '../../../lib/currency'
import {
  docTypeLabels,
  financeTableRowStyle,
  financeTableTdStyle,
  financeTableThStyle,
  invoiceStatusMap
} from '../financeUi'
import { useCancelInvoice, useInvoice, useIssueInvoice } from '../hooks/useFinance'

async function downloadInvoicePdf(id: string, number: string) {
  const response = await api.get(`/api/finance/invoices/${id}/pdf`, { responseType: 'text' })
  const blob = new Blob([response.data], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60000)
  void number
}

export default function InvoiceDetail() {
  const { id = '' } = useParams()
  const invoiceQuery = useInvoice(id)
  const issueInvoice = useIssueInvoice()
  const cancelInvoice = useCancelInvoice()
  const invoice = invoiceQuery.data as any

  const status = invoiceStatusMap[invoice?.status] ?? {
    label: invoice?.status ?? '—',
    bg: '#f3f4f6',
    color: '#374151'
  }

  const lines = invoice?.lines ?? []
  const isDraft = invoice?.status === 'DRAFT'
  const isIssued = invoice?.status === 'ISSUED'

  const totals = useMemo(
    () => ({
      subtotal: Number(invoice?.subtotal ?? 0),
      vatAmount: Number(invoice?.vatAmount ?? 0),
      total: Number(invoice?.totalAmount ?? 0)
    }),
    [invoice]
  )

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <BackButton to="/finance/invoices" />
      <PageHeader
        title={`Фактура ${invoice?.number ?? ''}`}
        subtitle={invoice?.docType ? docTypeLabels[invoice.docType] : undefined}
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button variant="secondary" onClick={() => downloadInvoicePdf(id, invoice?.number ?? '')}>
              Изтегли PDF
            </Button>
            {isIssued ? (
              <Button variant="secondary" onClick={() => cancelInvoice.mutate(id)} disabled={cancelInvoice.isPending}>
                {cancelInvoice.isPending ? 'Анулиране...' : 'Анулирай'}
              </Button>
            ) : null}
            {isDraft ? (
              <Button onClick={() => issueInvoice.mutate(id)} disabled={issueInvoice.isPending}>
                {issueInvoice.isPending ? 'Издаване...' : 'Издай'}
              </Button>
            ) : null}
          </div>
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
          fontSize: 14
        }}
      >
        <div>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Номер: </span>
          <span style={{ fontFamily: 'monospace' }}>{invoice?.number ?? '—'}</span>
        </div>
        <div>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Тип: </span>
          <span>{invoice?.docType ? docTypeLabels[invoice.docType] : '—'}</span>
        </div>
        {invoice?.customer ? (
          <div>
            <span style={{ color: '#6b7280', fontWeight: 600 }}>Клиент: </span>
            <span>{invoice.customer.name}</span>
          </div>
        ) : null}
        {invoice?.supplier ? (
          <div>
            <span style={{ color: '#6b7280', fontWeight: 600 }}>Доставчик: </span>
            <span>{invoice.supplier.name}</span>
          </div>
        ) : null}
        <div>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Дата на издаване: </span>
          <span>{invoice?.issueDate ? new Date(invoice.issueDate).toLocaleDateString('bg-BG') : '—'}</span>
        </div>
        <div>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Падеж: </span>
          <span>{invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString('bg-BG') : '—'}</span>
        </div>
        <div>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Бележка: </span>
          <span>{invoice?.note ?? '—'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Статус: </span>
          <StatusBadge label={status.label} bg={status.bg} color={status.color} />
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <th style={financeTableThStyle}>Описание</th>
              <th style={financeTableThStyle}>Количество</th>
              <th style={financeTableThStyle}>Ед. цена</th>
              <th style={financeTableThStyle}>ДДС %</th>
              <th style={{ ...financeTableThStyle, textAlign: 'right' }}>Сума</th>
            </tr>
          </thead>
          <tbody>
            {invoiceQuery.isLoading ? (
              <tr>
                <td colSpan={5} style={{ ...financeTableTdStyle, color: '#6b7280', textAlign: 'center' }}>
                  Зареждане...
                </td>
              </tr>
            ) : lines.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...financeTableTdStyle, color: '#6b7280', textAlign: 'center' }}>
                  Няма редове
                </td>
              </tr>
            ) : (
              lines.map((l: any) => (
                <tr
                  key={l.id}
                  style={financeTableRowStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <td style={financeTableTdStyle}>{l.description}</td>
                  <td style={financeTableTdStyle}>{l.quantity}</td>
                  <td style={financeTableTdStyle}>{formatCurrency(l.unitPrice)}</td>
                  <td style={financeTableTdStyle}>{l.vatRate}%</td>
                  <td style={{ ...financeTableTdStyle, textAlign: 'right', fontWeight: 600 }}>
                    {formatCurrency(l.lineTotal)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {lines.length > 0 ? (
            <tfoot>
              <tr style={{ borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <td colSpan={4} style={{ ...financeTableTdStyle, fontWeight: 700, textAlign: 'right' }}>
                  Данъчна основа:
                </td>
                <td style={{ ...financeTableTdStyle, textAlign: 'right', fontWeight: 700 }}>
                  {formatCurrency(totals.subtotal)}
                </td>
              </tr>
              <tr style={{ background: '#f9fafb' }}>
                <td colSpan={4} style={{ ...financeTableTdStyle, fontWeight: 700, textAlign: 'right' }}>
                  ДДС:
                </td>
                <td style={{ ...financeTableTdStyle, textAlign: 'right', fontWeight: 700 }}>
                  {formatCurrency(totals.vatAmount)}
                </td>
              </tr>
              <tr style={{ background: '#f9fafb' }}>
                <td colSpan={4} style={{ ...financeTableTdStyle, fontWeight: 700, textAlign: 'right' }}>
                  Общо:
                </td>
                <td style={{ ...financeTableTdStyle, textAlign: 'right', fontWeight: 700 }}>
                  {formatCurrency(totals.total)}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  )
}
