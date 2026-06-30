import { useMemo, useState } from 'react'
import { Button, Card, FormField, Input, PageHeader, StatusBadge } from '../../../components/ui'
import { formatCurrency } from '../../../lib/currency'
import {
  financeTableRowStyle,
  financeTableTdStyle,
  financeTableThStyle,
  receivableStatusMap
} from '../financeUi'
import { useReceivables, useRecordReceivablePayment } from '../hooks/useFinance'

export default function Receivables() {
  const receivables = useReceivables()
  const recordPayment = useRecordReceivablePayment()
  const rows = useMemo(() => (receivables.data ?? []) as Array<any>, [receivables.data])

  const [paymentTarget, setPaymentTarget] = useState<any | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().slice(0, 10),
    note: ''
  })

  const openPayment = (row: any) => {
    const remaining = Number(row.amountDue) - Number(row.amountPaid)
    setPaymentTarget(row)
    setPaymentForm({
      amount: remaining > 0 ? remaining : 0,
      paymentDate: new Date().toISOString().slice(0, 10),
      note: ''
    })
  }

  const submitPayment = async () => {
    if (!paymentTarget || !paymentForm.amount) return
    await recordPayment.mutateAsync({
      id: paymentTarget.id,
      amount: paymentForm.amount,
      paymentDate: paymentForm.paymentDate,
      note: paymentForm.note || undefined
    })
    setPaymentTarget(null)
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader title="Вземания" subtitle="Проследяване на вземания от клиенти" />

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <th style={financeTableThStyle}>Клиент</th>
              <th style={financeTableThStyle}>Фактура</th>
              <th style={{ ...financeTableThStyle, textAlign: 'right' }}>Дължимо</th>
              <th style={{ ...financeTableThStyle, textAlign: 'right' }}>Платено</th>
              <th style={financeTableThStyle}>Падеж</th>
              <th style={financeTableThStyle}>Статус</th>
              <th style={financeTableThStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...financeTableTdStyle, color: '#6b7280', textAlign: 'center' }}>
                  Няма вземания
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const st = receivableStatusMap[r.status] ?? { label: r.status, bg: '#f3f4f6', color: '#374151' }
                const canPay = r.status !== 'PAID'
                return (
                  <tr
                    key={r.id}
                    style={financeTableRowStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <td style={financeTableTdStyle}>{r.customer?.name ?? '—'}</td>
                    <td style={{ ...financeTableTdStyle, fontFamily: 'monospace' }}>{r.invoice?.number ?? '—'}</td>
                    <td style={{ ...financeTableTdStyle, textAlign: 'right' }}>{formatCurrency(r.amountDue)}</td>
                    <td style={{ ...financeTableTdStyle, textAlign: 'right' }}>{formatCurrency(r.amountPaid)}</td>
                    <td style={financeTableTdStyle}>
                      {r.dueDate ? new Date(r.dueDate).toLocaleDateString('bg-BG') : '—'}
                    </td>
                    <td style={financeTableTdStyle}>
                      <StatusBadge label={st.label} bg={st.bg} color={st.color} />
                    </td>
                    <td style={financeTableTdStyle}>
                      {canPay ? (
                        <Button variant="secondary" size="sm" onClick={() => openPayment(r)}>
                          Плащане
                        </Button>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {paymentTarget ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => setPaymentTarget(null)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420 }}>
            <Card>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Запис на плащане</h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>
                {paymentTarget.customer?.name} — фактура {paymentTarget.invoice?.number}
              </p>
              <FormField label="Сума" required>
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Дата на плащане">
                <Input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                />
              </FormField>
              <FormField label="Бележка">
                <Input
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  placeholder="По избор"
                />
              </FormField>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <Button variant="secondary" onClick={() => setPaymentTarget(null)}>
                  Отказ
                </Button>
                <Button onClick={submitPayment} disabled={recordPayment.isPending || !paymentForm.amount}>
                  {recordPayment.isPending ? 'Запис...' : 'Запиши'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  )
}
