import { useNavigate } from 'react-router-dom'
import { Button, Card, PageHeader, StatusBadge } from '../../../components/ui'
import { formatCurrency } from '../../../lib/currency'
import { downloadPosInvoicePdf, usePosInvoices } from '../hooks/usePos'

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  ISSUED: { label: 'Издадена', color: '#059669', bg: '#ecfdf5' },
  CANCELLED: { label: 'Анулирана', color: '#dc2626', bg: '#fef2f2' }
}

export default function PosInvoices() {
  const navigate = useNavigate()
  const invoices = usePosInvoices()
  const rows = (invoices.data ?? []) as Array<any>

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader title="Фактури" subtitle="POS фактури без модул Финанси" />

      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Номер', 'Контрагент', 'Дата', 'Сума', 'Статус', 'Действия'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 11 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>{row.number}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>{row.customer?.name}</td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                  {new Date(row.issueDate).toLocaleDateString('bg-BG')}
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                  {formatCurrency(row.totalAmount)}
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                  <StatusBadge
                    label={statusMap[row.status]?.label ?? row.status}
                    color={statusMap[row.status]?.color ?? '#6b7280'}
                    bg={statusMap[row.status]?.bg ?? '#f3f4f6'}
                  />
                </td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="secondary" onClick={() => navigate(`/pos/invoices/${row.id}`)}>
                      Преглед
                    </Button>
                    <Button variant="secondary" onClick={() => downloadPosInvoicePdf(row.id, row.number)}>
                      PDF
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
