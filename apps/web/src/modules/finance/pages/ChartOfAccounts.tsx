import { useState } from 'react'
import { Button, Card, FormField, FormRow, Input, PageHeader, Select } from '../../../components/ui'
import { useChartOfAccounts, useCreateChartOfAccount } from '../hooks/useFinance'
import { accountTypeLabels, financeTableTdStyle, financeTableThStyle } from '../financeUi'

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const

export default function ChartOfAccounts() {
  const chart = useChartOfAccounts()
  const createAccount = useCreateChartOfAccount()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    code: '',
    name: '',
    accountType: 'ASSET' as (typeof ACCOUNT_TYPES)[number],
    parentId: ''
  })

  const grouped = (chart.data?.grouped ?? []) as Array<{
    type: string
    label: string
    accounts: Array<{ id: string; code: string; name: string; accountType: string }>
  }>

  const flat = (chart.data?.flat ?? []) as Array<{ id: string; code: string; name: string }>

  const onCreate = async () => {
    if (!form.code || !form.name) return
    await createAccount.mutateAsync({
      code: form.code,
      name: form.name,
      accountType: form.accountType,
      parentId: form.parentId || null
    })
    setForm({ code: '', name: '', accountType: 'ASSET', parentId: '' })
    setShowForm(false)
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Сметкоплан"
        subtitle="Стандартен български сметкоплан"
        help={{
          title: 'Сметкоплан',
          content: 'Преглед на счетоводните сметки по тип. Можете да добавяте допълнителни аналитични сметки.'
        }}
        action={!showForm ? <Button onClick={() => setShowForm(true)}>+ Нова сметка</Button> : undefined}
      />

      {showForm ? (
        <Card style={{ marginBottom: 20 }}>
          <FormRow columns={4}>
            <FormField label="Код" required>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="4111" />
            </FormField>
            <FormField label="Наименование" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Име на сметка" />
            </FormField>
            <FormField label="Тип" required>
              <Select
                value={form.accountType}
                onChange={(e) => setForm({ ...form, accountType: e.target.value as (typeof ACCOUNT_TYPES)[number] })}
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {accountTypeLabels[t]}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Родителска сметка">
              <Select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                <option value="">— Няма —</option>
                {flat.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} — {a.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Отказ
            </Button>
            <Button onClick={onCreate} disabled={createAccount.isPending}>
              {createAccount.isPending ? 'Запис...' : 'Създай'}
            </Button>
          </div>
        </Card>
      ) : null}

      {chart.isLoading ? (
        <div style={{ padding: 40, color: '#9ca3af', textAlign: 'center' }}>Зареждане...</div>
      ) : grouped.length === 0 ? (
        <div style={{ padding: 40, color: '#9ca3af', textAlign: 'center' }}>Няма сметки</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {grouped.map((group) => (
            <div key={group.type} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#374151'
                }}
              >
                {group.label} ({group.type})
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                    <th style={financeTableThStyle}>Код</th>
                    <th style={financeTableThStyle}>Наименование</th>
                  </tr>
                </thead>
                <tbody>
                  {group.accounts.map((a) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ ...financeTableTdStyle, fontFamily: 'monospace', width: 120 }}>{a.code}</td>
                      <td style={financeTableTdStyle}>{a.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
