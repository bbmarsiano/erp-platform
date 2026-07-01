import { useMemo } from 'react'
import { PageHeader } from '../../../components/ui'
import { formatCurrency } from '../../../lib/currency'
import {
  useBankAccounts,
  useFinancialPeriods,
  useInvoices,
  useJournalEntries,
  usePayables,
  useReceivables
} from '../hooks/useFinance'

function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{value}</div>
      {subtitle ? <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>{subtitle}</div> : null}
    </div>
  )
}

export default function FinanceDashboard() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const currentYear = now.getFullYear()

  const outInvoices = useInvoices({ docType: 'INVOICE_OUT' })
  const inInvoices = useInvoices({ docType: 'INVOICE_IN' })
  const receivables = useReceivables()
  const payables = usePayables()
  const journalEntries = useJournalEntries({ from: monthStart })
  const bankAccounts = useBankAccounts()
  const periods = useFinancialPeriods()

  const outCount = useMemo(() => ((outInvoices.data ?? []) as Array<unknown>).length, [outInvoices.data])
  const inCount = useMemo(() => ((inInvoices.data ?? []) as Array<unknown>).length, [inInvoices.data])
  const journalCount = useMemo(() => ((journalEntries.data ?? []) as Array<unknown>).length, [journalEntries.data])
  const activeBankAccounts = useMemo(
    () => ((bankAccounts.data ?? []) as Array<any>).filter((a) => a.isActive).length,
    [bankAccounts.data]
  )

  const currentPeriod = useMemo(
    () => ((periods.data ?? []) as Array<any>).find((p) => p.isCurrent),
    [periods.data]
  )

  const closedPeriodsThisYear = useMemo(
    () =>
      ((periods.data ?? []) as Array<any>).filter((p) => p.isClosed && p.year === currentYear).length,
    [periods.data, currentYear]
  )

  const totalReceivables = useMemo(() => {
    return ((receivables.data ?? []) as Array<any>)
      .filter((r) => r.status !== 'PAID')
      .reduce((sum, r) => sum + (Number(r.amountDue) - Number(r.amountPaid)), 0)
  }, [receivables.data])

  const totalPayables = useMemo(() => {
    return ((payables.data ?? []) as Array<any>)
      .filter((p) => p.status !== 'PAID')
      .reduce((sum, p) => sum + (Number(p.amountDue) - Number(p.amountPaid)), 0)
  }, [payables.data])

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader title="Финанси" subtitle="Финансов модул — Фаза 5" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 12,
          marginTop: 20
        }}
      >
        <StatCard title="Изходящи фактури" value={outCount} />
        <StatCard title="Входящи фактури" value={inCount} />
        <StatCard title="Общо вземания" value={formatCurrency(totalReceivables)} subtitle="Неплатени салда" />
        <StatCard title="Общо задължения" value={formatCurrency(totalPayables)} subtitle="Неплатени салда" />
        <StatCard title="Записи в журнала" value={journalCount} subtitle="Текущ месец" />
        <StatCard title="Банкови сметки" value={activeBankAccounts} subtitle="Активни сметки" />
        <StatCard title="Периоди" value={closedPeriodsThisYear} subtitle="Затворени тази година" />
      </div>

      {currentPeriod ? (
        <div
          style={{
            marginTop: 20,
            padding: '14px 18px',
            borderRadius: 10,
            background: currentPeriod.isClosed ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${currentPeriod.isClosed ? '#fecaca' : '#bbf7d0'}`,
            fontSize: 14,
            fontWeight: 600,
            color: currentPeriod.isClosed ? '#991b1b' : '#166534'
          }}
        >
          {currentPeriod.isClosed
            ? `Период ${currentPeriod.periodLabel} е затворен — не могат да се добавят нови документи`
            : `Период ${currentPeriod.periodLabel} е отворен`}
        </div>
      ) : null}
    </div>
  )
}
