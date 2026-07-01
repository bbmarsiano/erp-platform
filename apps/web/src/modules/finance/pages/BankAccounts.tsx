import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, FormField, FormRow, Input, PageHeader, StatusBadge } from '../../../components/ui'
import { formatCurrency } from '../../../lib/currency'
import { financeTableRowStyle, financeTableTdStyle, financeTableThStyle } from '../financeUi'
import { useBankAccounts, useCreateBankAccount } from '../hooks/useFinance'

export default function BankAccounts() {
  const navigate = useNavigate()
  const accounts = useBankAccounts()
  const createAccount = useCreateBankAccount()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    iban: '',
    bankName: '',
    currency: 'BGN'
  })

  const rows = (accounts.data ?? []) as Array<any>

  const onCreate = async () => {
    if (!form.name || !form.iban) return
    await createAccount.mutateAsync({
      name: form.name,
      iban: form.iban,
      bankName: form.bankName || undefined,
      currency: form.currency || 'BGN'
    })
    setForm({ name: '', iban: '', bankName: '', currency: 'BGN' })
    setShowForm(false)
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Банкови сметки"
        subtitle="Управление на банкови сметки"
        action={!showForm ? <Button onClick={() => setShowForm(true)}>Нова сметка</Button> : undefined}
      />

      {showForm ? (
        <Card style={{ marginBottom: 20 }}>
          <FormRow columns={2}>
            <FormField label="Наименование" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Основна сметка — УниКредит"
              />
            </FormField>
            <FormField label="IBAN" required>
              <Input
                value={form.iban}
                onChange={(e) => setForm({ ...form, iban: e.target.value })}
                placeholder="BG80..."
              />
            </FormField>
          </FormRow>
          <FormRow columns={2}>
            <FormField label="Банка">
              <Input
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                placeholder="УниКредит Булбанк"
              />
            </FormField>
            <FormField label="Валута">
              <Input
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                placeholder="BGN"
              />
            </FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Отказ
            </Button>
            <Button onClick={onCreate} disabled={createAccount.isPending || !form.name || !form.iban}>
              {createAccount.isPending ? 'Запис...' : 'Запиши'}
            </Button>
          </div>
        </Card>
      ) : null}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <th style={financeTableThStyle}>IBAN</th>
              <th style={financeTableThStyle}>Наименование</th>
              <th style={financeTableThStyle}>Банка</th>
              <th style={financeTableThStyle}>Валута</th>
              <th style={{ ...financeTableThStyle, textAlign: 'right' }}>Салдо</th>
              <th style={financeTableThStyle}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...financeTableTdStyle, color: '#6b7280', textAlign: 'center' }}>
                  Няма банкови сметки
                </td>
              </tr>
            ) : (
              rows.map((a) => (
                <tr
                  key={a.id}
                  style={{ ...financeTableRowStyle, cursor: 'pointer' }}
                  onClick={() => navigate(`/finance/bank-transactions?bankAccountId=${a.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <td style={{ ...financeTableTdStyle, fontFamily: 'monospace', fontSize: 13 }}>{a.iban}</td>
                  <td style={financeTableTdStyle}>{a.name}</td>
                  <td style={financeTableTdStyle}>{a.bankName ?? '—'}</td>
                  <td style={financeTableTdStyle}>{a.currency}</td>
                  <td style={{ ...financeTableTdStyle, textAlign: 'right', fontWeight: 600 }}>
                    {formatCurrency(a.balance ?? 0)}
                  </td>
                  <td style={financeTableTdStyle}>
                    <StatusBadge
                      label={a.isActive ? 'Активна' : 'Неактивна'}
                      bg={a.isActive ? '#dcfce7' : '#f3f4f6'}
                      color={a.isActive ? '#166534' : '#6b7280'}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
