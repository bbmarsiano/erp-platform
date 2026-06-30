import { useState } from 'react'
import { Button, Card, FormField, FormRow, Input, PageHeader } from '../../../components/ui'
import { useCreateCustomer, useCustomers } from '../hooks/useFinance'
import { financeTableRowStyle, financeTableTdStyle, financeTableThStyle } from '../financeUi'

export default function Customers() {
  const customers = useCustomers()
  const createCustomer = useCreateCustomer()
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    code: '',
    name: '',
    eik: '',
    vatNumber: '',
    address: '',
    city: '',
    email: '',
    phone: '',
    contactPerson: ''
  })

  const onCreate = async () => {
    if (!form.code || !form.name) return
    await createCustomer.mutateAsync({
      code: form.code,
      name: form.name,
      eik: form.eik || undefined,
      vatNumber: form.vatNumber || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      contactPerson: form.contactPerson || undefined
    })
    setForm({
      code: '',
      name: '',
      eik: '',
      vatNumber: '',
      address: '',
      city: '',
      email: '',
      phone: '',
      contactPerson: ''
    })
    setShowForm(false)
  }

  const rows = (customers.data ?? []) as Array<any>
  const filtered = search.trim()
    ? rows.filter(
        (c) =>
          c.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.code?.toLowerCase().includes(search.toLowerCase()) ||
          c.eik?.toLowerCase().includes(search.toLowerCase())
      )
    : rows

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Клиенти"
        subtitle="Управление на клиенти"
        help={{
          title: 'Клиенти',
          content: 'Регистър на клиенти за фактуриране и финансово осчетоводяване (Фаза 2+).'
        }}
        action={!showForm ? <Button onClick={() => setShowForm(true)}>Нов клиент</Button> : undefined}
      />

      <div style={{ marginBottom: 16 }}>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Търсене по име, код или ЕИК..."
          style={{ maxWidth: 360 }}
        />
      </div>

      {showForm ? (
        <Card style={{ marginBottom: 20 }}>
          <FormRow columns={3}>
            <FormField label="Код" required>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CUST-001" />
            </FormField>
            <FormField label="Наименование" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Име на клиент" />
            </FormField>
            <FormField label="ЕИК">
              <Input value={form.eik} onChange={(e) => setForm({ ...form, eik: e.target.value })} placeholder="123456789" />
            </FormField>
          </FormRow>
          <FormRow columns={3}>
            <FormField label="ДДС номер">
              <Input value={form.vatNumber} onChange={(e) => setForm({ ...form, vatNumber: e.target.value })} placeholder="BG..." />
            </FormField>
            <FormField label="Контактно лице">
              <Input
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                placeholder="Контакт"
              />
            </FormField>
            <FormField label="Телефон">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+359..." />
            </FormField>
          </FormRow>
          <FormRow columns={3}>
            <FormField label="Email">
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
            </FormField>
            <FormField label="Град">
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="София" />
            </FormField>
            <FormField label="Адрес">
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="ул. ..." />
            </FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Отказ
            </Button>
            <Button onClick={onCreate} disabled={createCustomer.isPending}>
              {createCustomer.isPending ? 'Запис...' : 'Създай'}
            </Button>
          </div>
        </Card>
      ) : null}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <th style={financeTableThStyle}>Код</th>
              <th style={financeTableThStyle}>Наименование</th>
              <th style={financeTableThStyle}>ЕИК</th>
              <th style={financeTableThStyle}>ДДС номер</th>
              <th style={financeTableThStyle}>Контакт</th>
              <th style={financeTableThStyle}>Телефон</th>
              <th style={financeTableThStyle}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...financeTableTdStyle, color: '#6b7280', textAlign: 'center' }}>
                  Няма клиенти
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr
                  key={c.id}
                  style={financeTableRowStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <td style={{ ...financeTableTdStyle, fontFamily: 'monospace' }}>{c.code}</td>
                  <td style={{ ...financeTableTdStyle, fontWeight: 700 }}>{c.name}</td>
                  <td style={financeTableTdStyle}>{c.eik ?? '—'}</td>
                  <td style={financeTableTdStyle}>{c.vatNumber ?? '—'}</td>
                  <td style={financeTableTdStyle}>{c.contactPerson ?? '—'}</td>
                  <td style={financeTableTdStyle}>{c.phone ?? '—'}</td>
                  <td style={financeTableTdStyle}>{c.isActive ? 'Активен' : 'Неактивен'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
