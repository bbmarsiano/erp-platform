import { useMemo } from 'react'
import { PageHeader } from '../../../components/ui'
import { useChartOfAccounts, useCustomers } from '../hooks/useFinance'

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
  const customers = useCustomers()
  const chart = useChartOfAccounts()
  const customerCount = useMemo(() => ((customers.data ?? []) as Array<unknown>).length, [customers.data])
  const accountCount = useMemo(
    () => ((chart.data?.flat ?? []) as Array<unknown>).length,
    [chart.data]
  )

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader title="Финанси" subtitle="Финансов модул — Фаза 1" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 20 }}>
        <StatCard title="Клиенти" value={customerCount} />
        <StatCard title="Сметки" value={accountCount} />
        <StatCard title="Фактури" value="—" subtitle="Фаза 2+" />
      </div>
      <div
        style={{
          marginTop: 20,
          padding: '16px 20px',
          background: '#f8fafc',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          fontSize: 13,
          color: '#6b7280',
          lineHeight: 1.6
        }}
      >
        <strong style={{ color: '#374151' }}>Очаквайте в следващите фази:</strong> Фактури, Вземания, Задължения, Осчетоводяване и
        автоматизация.
      </div>
    </div>
  )
}
