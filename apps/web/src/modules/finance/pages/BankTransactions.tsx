import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Card, FormField, FormRow, Input, PageHeader, StatusBadge } from '../../../components/ui'
import { formatCurrency } from '../../../lib/currency'
import {
  bankTransactionTypeMap,
  financeTableRowStyle,
  financeTableTdStyle,
  financeTableThStyle,
  receivableStatusMap,
  reconciledStatusMap
} from '../financeUi'
import {
  useBankAccounts,
  useBankTransactions,
  useCreateBankTransaction,
  usePayables,
  useReceivables,
  useReconcileBankTransaction
} from '../hooks/useFinance'

function sortByAmountMatch<T extends { remaining: number }>(items: T[], targetAmount: number): T[] {
  const tolerance = targetAmount * 0.1
  const close = items.filter((i) => Math.abs(i.remaining - targetAmount) <= tolerance)
  const rest = items.filter((i) => Math.abs(i.remaining - targetAmount) > tolerance)
  close.sort((a, b) => Math.abs(a.remaining - targetAmount) - Math.abs(b.remaining - targetAmount))
  rest.sort((a, b) => Math.abs(a.remaining - targetAmount) - Math.abs(b.remaining - targetAmount))
  return [...close, ...rest]
}

export default function BankTransactions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const bankAccountId = searchParams.get('bankAccountId') ?? ''
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [transactionType, setTransactionType] = useState('')
  const [reconciledFilter, setReconciledFilter] = useState('')

  const accounts = useBankAccounts()
  const accountRows = (accounts.data ?? []) as Array<any>

  const filters = {
    ...(bankAccountId ? { bankAccountId } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(transactionType ? { transactionType } : {}),
    ...(reconciledFilter ? { isReconciled: reconciledFilter } : {})
  }

  const transactions = useBankTransactions(filters)
  const createTx = useCreateBankTransaction()
  const reconcile = useReconcileBankTransaction()
  const receivables = useReceivables()
  const payables = usePayables()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    bankAccountId: bankAccountId || '',
    transactionDate: new Date().toISOString().slice(0, 10),
    valueDate: '',
    amount: 0,
    description: '',
    counterparty: '',
    referenceNumber: '',
    transactionType: 'IN' as 'IN' | 'OUT' | 'TRANSFER'
  })

  const [reconcileTarget, setReconcileTarget] = useState<any | null>(null)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)

  const rows = useMemo(() => (transactions.data ?? []) as Array<any>, [transactions.data])

  const openReconcile = (tx: any) => {
    setReconcileTarget(tx)
    setSelectedMatchId(null)
  }

  const targetAmount = reconcileTarget ? Number(reconcileTarget.displayAmount ?? Math.abs(reconcileTarget.amount)) : 0
  const isIn = reconcileTarget?.transactionType === 'IN'

  const matchCandidates = useMemo(() => {
    if (!reconcileTarget) return []
    if (isIn) {
      const open = ((receivables.data ?? []) as Array<any>)
        .filter((r) => r.status !== 'PAID')
        .map((r) => ({
          id: r.id,
          label: r.customer?.name ?? '—',
          sublabel: `Фактура ${r.invoice?.number ?? '—'}`,
          remaining: Number(r.amountDue) - Number(r.amountPaid),
          status: r.status
        }))
      return sortByAmountMatch(open, targetAmount)
    }
    const open = ((payables.data ?? []) as Array<any>)
      .filter((p) => p.status !== 'PAID')
      .map((p) => ({
        id: p.id,
        label: p.supplierName ?? '—',
        sublabel: `Фактура ${p.invoice?.number ?? '—'}`,
        remaining: Number(p.amountDue) - Number(p.amountPaid),
        status: p.status
      }))
    return sortByAmountMatch(open, targetAmount)
  }, [reconcileTarget, isIn, receivables.data, payables.data, targetAmount])

  const tolerance = targetAmount * 0.1

  const onCreate = async () => {
    if (!form.bankAccountId || !form.description || !form.amount) return
    await createTx.mutateAsync({
      bankAccountId: form.bankAccountId,
      transactionDate: form.transactionDate,
      valueDate: form.valueDate || undefined,
      amount: form.amount,
      description: form.description,
      counterparty: form.counterparty || undefined,
      referenceNumber: form.referenceNumber || undefined,
      transactionType: form.transactionType
    })
    setShowForm(false)
    setForm({
      bankAccountId: bankAccountId || '',
      transactionDate: new Date().toISOString().slice(0, 10),
      valueDate: '',
      amount: 0,
      description: '',
      counterparty: '',
      referenceNumber: '',
      transactionType: 'IN'
    })
  }

  const submitReconcile = async () => {
    if (!reconcileTarget || !selectedMatchId) return
    await reconcile.mutateAsync({
      id: reconcileTarget.id,
      matchedType: isIn ? 'RECEIVABLE' : 'PAYABLE',
      matchedId: selectedMatchId
    })
    setReconcileTarget(null)
    setSelectedMatchId(null)
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Банкови транзакции"
        subtitle="Ръчен въвод и съпоставяне с вземания/задължения"
        action={!showForm ? <Button onClick={() => setShowForm(true)}>Нова транзакция</Button> : undefined}
      />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
          alignItems: 'flex-end'
        }}
      >
        <FormField label="Банкова сметка">
          <select
            value={bankAccountId}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams)
              if (e.target.value) next.set('bankAccountId', e.target.value)
              else next.delete('bankAccountId')
              setSearchParams(next)
            }}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', minWidth: 220 }}
          >
            <option value="">Всички сметки</option>
            {accountRows.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="От дата">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </FormField>
        <FormField label="До дата">
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </FormField>
        <FormField label="Тип">
          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }}
          >
            <option value="">Всички</option>
            <option value="IN">Вход</option>
            <option value="OUT">Изход</option>
          </select>
        </FormField>
        <FormField label="Съпоставяне">
          <select
            value={reconciledFilter}
            onChange={(e) => setReconciledFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }}
          >
            <option value="">Всички</option>
            <option value="false">Несъпоставени</option>
            <option value="true">Съпоставени</option>
          </select>
        </FormField>
      </div>

      {showForm ? (
        <Card style={{ marginBottom: 20 }}>
          <FormRow columns={3}>
            <FormField label="Банкова сметка" required>
              <select
                value={form.bankAccountId}
                onChange={(e) => setForm({ ...form, bankAccountId: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }}
              >
                <option value="">Изберете...</option>
                {accountRows.filter((a) => a.isActive).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Тип" required>
              <select
                value={form.transactionType}
                onChange={(e) =>
                  setForm({ ...form, transactionType: e.target.value as 'IN' | 'OUT' | 'TRANSFER' })
                }
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }}
              >
                <option value="IN">Вход (постъпление)</option>
                <option value="OUT">Изход (плащане)</option>
                <option value="TRANSFER">Превод</option>
              </select>
            </FormField>
            <FormField label="Сума" required>
              <Input
                type="number"
                min={0.01}
                step="0.01"
                value={form.amount || ''}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </FormField>
          </FormRow>
          <FormRow columns={3}>
            <FormField label="Дата на транзакция" required>
              <Input
                type="date"
                value={form.transactionDate}
                onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
              />
            </FormField>
            <FormField label="Вальор">
              <Input
                type="date"
                value={form.valueDate}
                onChange={(e) => setForm({ ...form, valueDate: e.target.value })}
              />
            </FormField>
            <FormField label="Референция">
              <Input
                value={form.referenceNumber}
                onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
              />
            </FormField>
          </FormRow>
          <FormRow columns={2}>
            <FormField label="Описание" required>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </FormField>
            <FormField label="Контрагент">
              <Input
                value={form.counterparty}
                onChange={(e) => setForm({ ...form, counterparty: e.target.value })}
              />
            </FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Отказ
            </Button>
            <Button
              onClick={onCreate}
              disabled={createTx.isPending || !form.bankAccountId || !form.description || !form.amount}
            >
              {createTx.isPending ? 'Запис...' : 'Запиши'}
            </Button>
          </div>
        </Card>
      ) : null}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <th style={financeTableThStyle}>Дата</th>
              <th style={financeTableThStyle}>Описание</th>
              <th style={financeTableThStyle}>Контрагент</th>
              <th style={{ ...financeTableThStyle, textAlign: 'right' }}>Сума</th>
              <th style={financeTableThStyle}>Тип</th>
              <th style={financeTableThStyle}>Съпоставяне</th>
              <th style={financeTableThStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...financeTableTdStyle, color: '#6b7280', textAlign: 'center' }}>
                  Няма транзакции
                </td>
              </tr>
            ) : (
              rows.map((tx) => {
                const typeSt = bankTransactionTypeMap[tx.transactionType] ?? {
                  label: tx.transactionType,
                  bg: '#f3f4f6',
                  color: '#374151'
                }
                const recSt = reconciledStatusMap[String(tx.isReconciled)] ?? reconciledStatusMap.false
                const displayAmt = Number(tx.displayAmount ?? Math.abs(tx.amount))
                const isIncoming = tx.transactionType === 'IN'
                return (
                  <tr key={tx.id} style={financeTableRowStyle}>
                    <td style={financeTableTdStyle}>
                      {new Date(tx.transactionDate).toLocaleDateString('bg-BG')}
                    </td>
                    <td style={financeTableTdStyle}>{tx.description}</td>
                    <td style={financeTableTdStyle}>{tx.counterparty ?? '—'}</td>
                    <td style={{ ...financeTableTdStyle, textAlign: 'right', fontWeight: 600 }}>
                      <span style={{ color: isIncoming ? '#166534' : '#991b1b' }}>
                        {formatCurrency(displayAmt)}
                      </span>
                    </td>
                    <td style={financeTableTdStyle}>
                      <StatusBadge label={typeSt.label} bg={typeSt.bg} color={typeSt.color} />
                    </td>
                    <td style={financeTableTdStyle}>
                      <StatusBadge label={recSt.label} bg={recSt.bg} color={recSt.color} />
                    </td>
                    <td style={financeTableTdStyle}>
                      {!tx.isReconciled && (tx.transactionType === 'IN' || tx.transactionType === 'OUT') ? (
                        <Button variant="secondary" size="sm" onClick={() => openReconcile(tx)}>
                          Съпостави
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

      {reconcileTarget ? (
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
          onClick={() => setReconcileTarget(null)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 520 }}>
            <Card>
              <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>Съпоставяне на транзакция</h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>
                {reconcileTarget.description} — {formatCurrency(targetAmount)}
              </p>
              <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 600 }}>
                {isIn ? 'Вземания' : 'Задължения'}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                {matchCandidates.length === 0 ? (
                  <div style={{ padding: 16, color: '#6b7280', textAlign: 'center' }}>
                    Няма отворени {isIn ? 'вземания' : 'задължения'}
                  </div>
                ) : (
                  matchCandidates.map((c, idx) => {
                    const isClose = Math.abs(c.remaining - targetAmount) <= tolerance
                    const showDivider =
                      idx > 0 &&
                      Math.abs(matchCandidates[idx - 1].remaining - targetAmount) <= tolerance &&
                      !isClose
                    const st = receivableStatusMap[c.status] ?? { label: c.status, bg: '#f3f4f6', color: '#374151' }
                    return (
                      <div key={c.id}>
                        {showDivider ? (
                          <div
                            style={{
                              padding: '6px 12px',
                              fontSize: 11,
                              color: '#9ca3af',
                              background: '#f9fafb',
                              borderTop: '1px solid #e5e7eb'
                            }}
                          >
                            Други
                          </div>
                        ) : null}
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 16px',
                            cursor: 'pointer',
                            background: selectedMatchId === c.id ? '#eff6ff' : 'transparent',
                            borderBottom: '1px solid #f3f4f6'
                          }}
                        >
                          <input
                            type="radio"
                            name="match"
                            checked={selectedMatchId === c.id}
                            onChange={() => setSelectedMatchId(c.id)}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{c.label}</div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>{c.sublabel}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 600 }}>{formatCurrency(c.remaining)}</div>
                            <StatusBadge label={st.label} bg={st.bg} color={st.color} />
                          </div>
                          {isClose ? (
                            <span style={{ fontSize: 10, color: '#166534', fontWeight: 600 }}>≈ съвпадение</span>
                          ) : null}
                        </label>
                      </div>
                    )
                  })
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <Button variant="secondary" onClick={() => setReconcileTarget(null)}>
                  Отказ
                </Button>
                <Button onClick={submitReconcile} disabled={reconcile.isPending || !selectedMatchId}>
                  {reconcile.isPending ? 'Съпоставяне...' : 'Потвърди'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  )
}
