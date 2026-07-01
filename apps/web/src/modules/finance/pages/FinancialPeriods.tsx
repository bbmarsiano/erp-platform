import { useMemo, useState } from 'react'
import { useAuthStore } from '../../../store/auth.store'
import { Button, Card, PageHeader, StatusBadge } from '../../../components/ui'
import { financeTableRowStyle, financeTableTdStyle, financeTableThStyle, periodStatusMap } from '../financeUi'
import { useCloseFinancialPeriod, useFinancialPeriods, useReopenFinancialPeriod } from '../hooks/useFinance'

export default function FinancialPeriods() {
  const user = useAuthStore((s) => s.user)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const periods = useFinancialPeriods()
  const closePeriod = useCloseFinancialPeriod()
  const reopenPeriod = useReopenFinancialPeriod()
  const [closeTarget, setCloseTarget] = useState<any | null>(null)

  const rows = useMemo(() => {
    const all = (periods.data ?? []) as Array<any>
    return all.slice(0, 13)
  }, [periods.data])

  const currentPeriod = useMemo(() => rows.find((p) => p.isCurrent), [rows])

  const submitClose = async () => {
    if (!closeTarget) return
    await closePeriod.mutateAsync({ year: closeTarget.year, month: closeTarget.month })
    setCloseTarget(null)
  }

  const handleReopen = async (row: any) => {
    await reopenPeriod.mutateAsync({ year: row.year, month: row.month })
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader title="Счетоводни периоди" subtitle="Управление на счетоводни периоди" />

      {currentPeriod ? (
        <div
          style={{
            marginBottom: 20,
            padding: '14px 18px',
            borderRadius: 10,
            background: currentPeriod.isClosed ? '#fef2f2' : '#eff6ff',
            border: `1px solid ${currentPeriod.isClosed ? '#fecaca' : '#bfdbfe'}`,
            fontSize: 14,
            fontWeight: 600,
            color: currentPeriod.isClosed ? '#991b1b' : '#1e40af'
          }}
        >
          Текущ период: {currentPeriod.periodLabel} —{' '}
          {currentPeriod.isClosed ? 'ЗАТВОРЕН' : 'ОТВОРЕН'}
        </div>
      ) : null}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <th style={financeTableThStyle}>Период</th>
              <th style={financeTableThStyle}>Статус</th>
              <th style={financeTableThStyle}>Затворен от</th>
              <th style={financeTableThStyle}>Затворен на</th>
              <th style={financeTableThStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...financeTableTdStyle, textAlign: 'center', color: '#6b7280' }}>
                  Няма периоди
                </td>
              </tr>
            ) : (
              rows.map((p) => {
                const st = p.isClosed ? periodStatusMap.closed : periodStatusMap.open
                return (
                  <tr
                    key={p.id}
                    style={{
                      ...financeTableRowStyle,
                      background: p.isCurrent ? '#eff6ff' : 'transparent'
                    }}
                  >
                    <td style={{ ...financeTableTdStyle, fontWeight: p.isCurrent ? 700 : 400 }}>
                      {p.periodLabel}
                      {p.isCurrent ? (
                        <span style={{ marginLeft: 8, fontSize: 11, color: '#2563eb' }}>(текущ)</span>
                      ) : null}
                    </td>
                    <td style={financeTableTdStyle}>
                      <StatusBadge label={st.label} bg={st.bg} color={st.color} />
                    </td>
                    <td style={financeTableTdStyle}>{p.closedByName ?? '—'}</td>
                    <td style={financeTableTdStyle}>
                      {p.closedAt ? new Date(p.closedAt).toLocaleDateString('bg-BG') : '—'}
                    </td>
                    <td style={financeTableTdStyle}>
                      {!p.isClosed ? (
                        <Button variant="secondary" size="sm" onClick={() => setCloseTarget(p)}>
                          Затвори
                        </Button>
                      ) : isSuperAdmin ? (
                        <Button variant="secondary" size="sm" onClick={() => handleReopen(p)}>
                          Отвори
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

      {closeTarget ? (
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
          onClick={() => setCloseTarget(null)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480 }}>
            <Card>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>Затваряне на период</h3>
              <p style={{ margin: '0 0 20px', fontSize: 14, color: '#4b5563', lineHeight: 1.5 }}>
                Сигурни ли сте, че искате да затворите период {closeTarget.periodLabel}? След затварянето не
                може да се създават или редактират документи за този период. Уверете се, че всички фактури са
                издадени.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => setCloseTarget(null)}>
                  Отказ
                </Button>
                <Button variant="danger" onClick={submitClose} disabled={closePeriod.isPending}>
                  {closePeriod.isPending ? 'Затваряне...' : 'Затвори периода'}
                </Button>
              </div>
              {closePeriod.isError ? (
                <p style={{ margin: '12px 0 0', fontSize: 13, color: '#dc2626' }}>
                  {(closePeriod.error as any)?.response?.data?.error ??
                    'Грешка при затваряне на периода'}
                </p>
              ) : null}
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  )
}
