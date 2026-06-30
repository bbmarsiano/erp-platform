import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, PageHeader, StatusBadge } from '../../../components/ui'
import { formatCurrency } from '../../../lib/currency'
import {
  financeTableRowStyle,
  financeTableTdStyle,
  financeTableThStyle,
  journalSourceTypeMap
} from '../financeUi'
import { useJournalEntries } from '../hooks/useFinance'

export default function JournalEntries() {
  const navigate = useNavigate()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const entries = useJournalEntries({ from: monthStart })
  const rows = useMemo(() => (entries.data ?? []) as Array<any>, [entries.data])

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader title="Главна книга" subtitle="Счетоводни записи (само за четене)" />

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <th style={financeTableThStyle}>Дата</th>
              <th style={financeTableThStyle}>Описание</th>
              <th style={financeTableThStyle}>Източник</th>
              <th style={{ ...financeTableThStyle, textAlign: 'right' }}>Дебит</th>
              <th style={{ ...financeTableThStyle, textAlign: 'right' }}>Кредит</th>
              <th style={financeTableThStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...financeTableTdStyle, color: '#6b7280', textAlign: 'center' }}>
                  Няма записи за текущия месец
                </td>
              </tr>
            ) : (
              rows.map((entry) => {
                const source = journalSourceTypeMap[entry.sourceType] ?? {
                  label: entry.sourceType,
                  bg: '#f3f4f6',
                  color: '#374151'
                }
                return (
                  <tr
                    key={entry.id}
                    style={financeTableRowStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <td style={financeTableTdStyle}>
                      {entry.entryDate ? new Date(entry.entryDate).toLocaleDateString('bg-BG') : '—'}
                    </td>
                    <td style={financeTableTdStyle}>{entry.description}</td>
                    <td style={financeTableTdStyle}>
                      <StatusBadge label={source.label} bg={source.bg} color={source.color} />
                    </td>
                    <td style={{ ...financeTableTdStyle, textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrency(entry.totalDebit)}
                    </td>
                    <td style={{ ...financeTableTdStyle, textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrency(entry.totalCredit)}
                    </td>
                    <td style={financeTableTdStyle}>
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/finance/journal-entries/${entry.id}`)}>
                        Преглед
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
