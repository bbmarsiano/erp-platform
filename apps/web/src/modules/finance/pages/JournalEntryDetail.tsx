import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { BackButton, PageHeader, StatusBadge } from '../../../components/ui'
import { formatCurrency } from '../../../lib/currency'
import {
  financeTableRowStyle,
  financeTableTdStyle,
  financeTableThStyle,
  journalSourceTypeMap
} from '../financeUi'
import { useJournalEntry } from '../hooks/useFinance'

export default function JournalEntryDetail() {
  const { id = '' } = useParams()
  const entryQuery = useJournalEntry(id)
  const entry = entryQuery.data as any

  const source = journalSourceTypeMap[entry?.sourceType] ?? {
    label: entry?.sourceType ?? '—',
    bg: '#f3f4f6',
    color: '#374151'
  }

  const lines = entry?.lines ?? []
  const totals = useMemo(
    () => ({
      debit: Number(entry?.totalDebit ?? 0),
      credit: Number(entry?.totalCredit ?? 0),
      balanced: Boolean(entry?.isBalanced)
    }),
    [entry]
  )

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <BackButton to="/finance/journal-entries" />
      <PageHeader title="Счетоводен запис" subtitle={entry?.description} />

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
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Дата: </span>
          <span>{entry?.entryDate ? new Date(entry.entryDate).toLocaleDateString('bg-BG') : '—'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Източник: </span>
          <StatusBadge label={source.label} bg={source.bg} color={source.color} />
        </div>
        <div>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>Баланс: </span>
          <span style={{ color: totals.balanced ? '#166534' : '#991b1b', fontWeight: 700 }}>
            {totals.balanced ? 'Балансиран ✓' : 'Небалансиран ✗'}
          </span>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <th style={financeTableThStyle}>Сметка</th>
              <th style={financeTableThStyle}>Описание</th>
              <th style={{ ...financeTableThStyle, textAlign: 'right' }}>Дебит</th>
              <th style={{ ...financeTableThStyle, textAlign: 'right' }}>Кредит</th>
            </tr>
          </thead>
          <tbody>
            {entryQuery.isLoading ? (
              <tr>
                <td colSpan={4} style={{ ...financeTableTdStyle, color: '#6b7280', textAlign: 'center' }}>
                  Зареждане...
                </td>
              </tr>
            ) : lines.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ ...financeTableTdStyle, color: '#6b7280', textAlign: 'center' }}>
                  Няма редове
                </td>
              </tr>
            ) : (
              lines.map((line: any) => (
                <tr
                  key={line.id}
                  style={financeTableRowStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <td style={financeTableTdStyle}>
                    {line.account ? `${line.account.code} — ${line.account.name}` : line.accountId}
                  </td>
                  <td style={financeTableTdStyle}>{line.description ?? '—'}</td>
                  <td style={{ ...financeTableTdStyle, textAlign: 'right' }}>
                    {line.debit > 0 ? formatCurrency(line.debit) : '—'}
                  </td>
                  <td style={{ ...financeTableTdStyle, textAlign: 'right' }}>
                    {line.credit > 0 ? formatCurrency(line.credit) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {lines.length > 0 ? (
            <tfoot>
              <tr style={{ borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <td colSpan={2} style={{ ...financeTableTdStyle, fontWeight: 700, textAlign: 'right' }}>
                  Общо:
                </td>
                <td style={{ ...financeTableTdStyle, textAlign: 'right', fontWeight: 700 }}>
                  {formatCurrency(totals.debit)}
                </td>
                <td style={{ ...financeTableTdStyle, textAlign: 'right', fontWeight: 700 }}>
                  {formatCurrency(totals.credit)}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  )
}
