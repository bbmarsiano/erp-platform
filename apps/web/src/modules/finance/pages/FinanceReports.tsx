import { useCallback, useState } from 'react'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Button, FormField, Input, PageHeader } from '../../../components/ui'
import { formatCurrency } from '../../../lib/currency'
import { financeTableTdStyle, financeTableThStyle } from '../financeUi'
import { useBalanceSheet, useIncomeStatement, useTrialBalance } from '../hooks/useFinance'

type Tab = 'trial-balance' | 'income-statement' | 'balance-sheet'

const MONTHS = [
  { value: '', label: 'Всичко' },
  { value: '1', label: 'Януари' },
  { value: '2', label: 'Февруари' },
  { value: '3', label: 'Март' },
  { value: '4', label: 'Април' },
  { value: '5', label: 'Май' },
  { value: '6', label: 'Юни' },
  { value: '7', label: 'Юли' },
  { value: '8', label: 'Август' },
  { value: '9', label: 'Септември' },
  { value: '10', label: 'Октомври' },
  { value: '11', label: 'Ноември' },
  { value: '12', label: 'Декември' }
]

export default function FinanceReports() {
  const [activeTab, setActiveTab] = useState<Tab>('trial-balance')
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(String(currentYear))
  const [month, setMonth] = useState('')
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10))

  const yearNum = year ? Number(year) : undefined
  const monthNum = month ? Number(month) : undefined

  const trialBalance = useTrialBalance(yearNum, monthNum)
  const incomeStatement = useIncomeStatement(yearNum, monthNum)
  const balanceSheet = useBalanceSheet(activeTab === 'balance-sheet' ? asOfDate : undefined)

  const tabs = [
    { id: 'trial-balance' as const, label: 'Оборотна ведомост' },
    { id: 'income-statement' as const, label: 'ОПР' },
    { id: 'balance-sheet' as const, label: 'Баланс' }
  ]

  const exportExcel = useCallback(() => {
    let rows: Record<string, string | number>[] = []
    let sheetName = ''
    let fileName = ''

    if (activeTab === 'trial-balance' && trialBalance.data) {
      const data = trialBalance.data
      sheetName = 'Оборотна ведомост'
      rows = (data.accounts ?? []).map(
        (a: { accountCode: string; accountName: string; totalDebit: number; totalCredit: number; balance: number }) => ({
          Код: a.accountCode,
          Сметка: a.accountName,
          Дебит: a.totalDebit,
          Кредит: a.totalCredit,
          Салдо: a.balance
        })
      )
      rows.push({
        Код: '',
        Сметка: 'ОБЩО',
        Дебит: data.totalDebit,
        Кредит: data.totalCredit,
        Салдо: data.totalDebit - data.totalCredit
      })
      fileName = `Финанси_Оборотна_${year || 'всичко'}${month ? `_${month}` : ''}.xlsx`
    } else if (activeTab === 'income-statement' && incomeStatement.data) {
      const data = incomeStatement.data
      sheetName = 'ОПР'
      rows = [
        ...(data.revenues ?? []).map((r: { accountCode: string; accountName: string; amount: number }) => ({
          Раздел: 'ПРИХОДИ',
          Код: r.accountCode,
          Сметка: r.accountName,
          Сума: r.amount
        })),
        { Раздел: 'ПРИХОДИ', Код: '', Сметка: 'ОБЩО ПРИХОДИ', Сума: data.revenueTotal },
        ...(data.expenses ?? []).map((e: { accountCode: string; accountName: string; amount: number }) => ({
          Раздел: 'РАЗХОДИ',
          Код: e.accountCode,
          Сметка: e.accountName,
          Сума: e.amount
        })),
        { Раздел: 'РАЗХОДИ', Код: '', Сметка: 'ОБЩО РАЗХОДИ', Сума: data.expenseTotal },
        { Раздел: 'РЕЗУЛТАТ', Код: '', Сметка: 'НЕТЕН РЕЗУЛТАТ', Сума: data.netResult }
      ]
      fileName = `Финанси_ОПР_${year || 'всичко'}${month ? `_${month}` : ''}.xlsx`
    } else if (activeTab === 'balance-sheet' && balanceSheet.data) {
      const data = balanceSheet.data
      sheetName = 'Баланс'
      rows = [
        ...(data.assets ?? []).map((a: { accountCode: string; accountName: string; amount: number }) => ({
          Раздел: 'АКТИВИ',
          Код: a.accountCode,
          Сметка: a.accountName,
          Сума: a.amount
        })),
        { Раздел: 'АКТИВИ', Код: '', Сметка: 'ОБЩО АКТИВИ', Сума: data.assetsTotal },
        ...(data.liabilities ?? []).map((l: { accountCode: string; accountName: string; amount: number }) => ({
          Раздел: 'ПАСИВИ',
          Код: l.accountCode,
          Сметка: l.accountName,
          Сума: l.amount
        })),
        { Раздел: 'ПАСИВИ', Код: '', Сметка: 'ОБЩО ПАСИВИ', Сума: data.liabilitiesTotal },
        { Раздел: 'КАПИТАЛ', Код: '', Сметка: 'СОБСТВЕН КАПИТАЛ', Сума: data.equity },
        { Раздел: '', Код: '', Сметка: 'Разлика', Сума: data.difference }
      ]
      fileName = `Финанси_Баланс_${data.asOf}.xlsx`
    }

    if (!rows.length) return
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, fileName)
  }, [activeTab, trialBalance.data, incomeStatement.data, balanceSheet.data, year, month])

  const tabStyle = (id: Tab) => ({
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    borderBottom: activeTab === id ? '2px solid #2563eb' : '2px solid transparent',
    background: 'transparent',
    color: activeTab === id ? '#2563eb' : '#6b7280',
    cursor: 'pointer'
  })

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Справки"
        subtitle="Финансови отчети — оборотна ведомост, ОПР и баланс"
        action={
          <Button variant="secondary" onClick={exportExcel}>
            <Download size={16} style={{ marginRight: 6 }} />
            Експорт Excel
          </Button>
        }
      />

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
        {tabs.map((t) => (
          <button key={t.id} type="button" style={tabStyle(t.id)} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab !== 'balance-sheet' ? (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-end' }}>
          <FormField label="Година">
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Всичко"
              style={{ width: 100 }}
            />
          </FormField>
          <FormField label="Месец">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', minWidth: 140 }}
            >
              {MONTHS.map((m) => (
                <option key={m.value || 'all'} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <FormField label="Към дата">
            <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} style={{ width: 180 }} />
          </FormField>
        </div>
      )}

      {activeTab === 'trial-balance' ? (
        <TrialBalanceView data={trialBalance.data} isLoading={trialBalance.isLoading} />
      ) : null}
      {activeTab === 'income-statement' ? (
        <IncomeStatementView data={incomeStatement.data} isLoading={incomeStatement.isLoading} />
      ) : null}
      {activeTab === 'balance-sheet' ? (
        <BalanceSheetView data={balanceSheet.data} isLoading={balanceSheet.isLoading} />
      ) : null}
    </div>
  )
}

function TrialBalanceView({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) return <p style={{ color: '#6b7280' }}>Зареждане...</p>
  if (!data) return null

  const accounts = data.accounts ?? []

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <th style={financeTableThStyle}>Код</th>
            <th style={financeTableThStyle}>Сметка</th>
            <th style={{ ...financeTableThStyle, textAlign: 'right' }}>Дебит</th>
            <th style={{ ...financeTableThStyle, textAlign: 'right' }}>Кредит</th>
            <th style={{ ...financeTableThStyle, textAlign: 'right' }}>Салдо</th>
          </tr>
        </thead>
        <tbody>
          {accounts.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ ...financeTableTdStyle, textAlign: 'center', color: '#6b7280' }}>
                Няма данни за избрания период
              </td>
            </tr>
          ) : (
            accounts.map((a: any) => (
              <tr key={a.accountCode} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ ...financeTableTdStyle, fontFamily: 'monospace' }}>{a.accountCode}</td>
                <td style={financeTableTdStyle}>{a.accountName}</td>
                <td style={{ ...financeTableTdStyle, textAlign: 'right' }}>{formatCurrency(a.totalDebit)}</td>
                <td style={{ ...financeTableTdStyle, textAlign: 'right' }}>{formatCurrency(a.totalCredit)}</td>
                <td style={{ ...financeTableTdStyle, textAlign: 'right', fontWeight: 600 }}>
                  {formatCurrency(a.balance)}
                </td>
              </tr>
            ))
          )}
        </tbody>
        {accounts.length > 0 ? (
          <tfoot>
            <tr style={{ background: '#f9fafb', fontWeight: 700 }}>
              <td colSpan={2} style={financeTableTdStyle}>
                ОБЩО
              </td>
              <td style={{ ...financeTableTdStyle, textAlign: 'right' }}>{formatCurrency(data.totalDebit)}</td>
              <td style={{ ...financeTableTdStyle, textAlign: 'right' }}>{formatCurrency(data.totalCredit)}</td>
              <td style={{ ...financeTableTdStyle, textAlign: 'right' }}>
                {formatCurrency(data.totalDebit - data.totalCredit)}
              </td>
            </tr>
          </tfoot>
        ) : null}
      </table>
      {accounts.length > 0 && !data.isBalanced ? (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef3c7',
            color: '#92400e',
            fontSize: 13,
            borderTop: '1px solid #fde68a'
          }}
        >
          Внимание: общият дебит ({formatCurrency(data.totalDebit)}) не съвпада с общия кредит (
          {formatCurrency(data.totalCredit)})
        </div>
      ) : null}
      {accounts.length > 0 && data.isBalanced ? (
        <div
          style={{
            padding: '12px 16px',
            background: '#dcfce7',
            color: '#166534',
            fontSize: 13,
            borderTop: '1px solid #bbf7d0'
          }}
        >
          Дебит и кредит са в равновесие
        </div>
      ) : null}
    </div>
  )
}

function IncomeStatementView({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) return <p style={{ color: '#6b7280' }}>Зареждане...</p>
  if (!data) return null

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#166534' }}>ПРИХОДИ</h3>
        {(data.revenues ?? []).length === 0 ? (
          <p style={{ color: '#6b7280', margin: 0 }}>Няма приходи за периода</p>
        ) : (
          (data.revenues ?? []).map((r: any) => (
            <div
              key={r.accountCode}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}
            >
              <span>
                <span style={{ fontFamily: 'monospace', marginRight: 8 }}>{r.accountCode}</span>
                {r.accountName}
              </span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(r.amount)}</span>
            </div>
          ))
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontWeight: 700 }}>
          <span>Общо приходи</span>
          <span>{formatCurrency(data.revenueTotal)}</span>
        </div>
      </section>

      <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#991b1b' }}>РАЗХОДИ</h3>
        {(data.expenses ?? []).length === 0 ? (
          <p style={{ color: '#6b7280', margin: 0 }}>Няма разходи за периода</p>
        ) : (
          (data.expenses ?? []).map((e: any) => (
            <div
              key={e.accountCode}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}
            >
              <span>
                <span style={{ fontFamily: 'monospace', marginRight: 8 }}>{e.accountCode}</span>
                {e.accountName}
              </span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(e.amount)}</span>
            </div>
          ))
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontWeight: 700 }}>
          <span>Общо разходи</span>
          <span>{formatCurrency(data.expenseTotal)}</span>
        </div>
      </section>

      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 700 }}>НЕТЕН РЕЗУЛТАТ</span>
        <span
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: data.netResult >= 0 ? '#166534' : '#991b1b'
          }}
        >
          {formatCurrency(data.netResult)}
        </span>
      </div>
    </div>
  )
}

function BalanceSheetView({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) return <p style={{ color: '#6b7280' }}>Зареждане...</p>
  if (!data) return null

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>АКТИВИ</h3>
          {(data.assets ?? []).map((a: any) => (
            <div
              key={a.accountCode}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}
            >
              <span>
                <span style={{ fontFamily: 'monospace', marginRight: 8 }}>{a.accountCode}</span>
                {a.accountName}
              </span>
              <span>{formatCurrency(a.amount)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontWeight: 700 }}>
            <span>Общо активи</span>
            <span>{formatCurrency(data.assetsTotal)}</span>
          </div>
        </section>

        <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>ПАСИВИ + СОБСТВЕН КАПИТАЛ</h3>
          {(data.liabilities ?? []).map((l: any) => (
            <div
              key={l.accountCode}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}
            >
              <span>
                <span style={{ fontFamily: 'monospace', marginRight: 8 }}>{l.accountCode}</span>
                {l.accountName}
              </span>
              <span>{formatCurrency(l.amount)}</span>
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderTop: '1px solid #e5e7eb',
              marginTop: 8,
              fontWeight: 600
            }}
          >
            <span>Собствен капитал</span>
            <span>{formatCurrency(data.equity)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontWeight: 700 }}>
            <span>Общо пасиви + капитал</span>
            <span>{formatCurrency(data.liabilitiesTotal + data.equity)}</span>
          </div>
        </section>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: '12px 16px',
          borderRadius: 8,
          background: data.isBalanced ? '#dcfce7' : '#fef3c7',
          color: data.isBalanced ? '#166534' : '#92400e',
          fontSize: 13
        }}
      >
        {data.isBalanced ? (
          <>Активи = Пасиви + Капитал</>
        ) : (
          <>
            Активи ({formatCurrency(data.assetsTotal)}) ≠ Пасиви + Капитал (
            {formatCurrency(data.liabilitiesTotal + data.equity)}) — Разлика:{' '}
            {formatCurrency(data.difference)}
          </>
        )}
      </div>
    </div>
  )
}
