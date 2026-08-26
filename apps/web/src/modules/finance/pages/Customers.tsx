import { useState } from 'react'
import { Edit2 } from 'lucide-react'
import { Button, Card, FormField, FormRow, Input, PageHeader } from '../../../components/ui'
import { useCreateCustomer, useCustomers, useUpdateCustomer } from '../hooks/useFinance'
import { financeTableRowStyle, financeTableTdStyle, financeTableThStyle } from '../financeUi'

const emptyForm = {
  code: '',
  name: '',
  eik: '',
  vatNumber: '',
  address: '',
  city: '',
  email: '',
  phone: '',
  contactPerson: ''
}

type CustomerRow = {
  id: string
  code: string
  name: string
  eik?: string | null
  vatNumber?: string | null
  address?: string | null
  city?: string | null
  email?: string | null
  phone?: string | null
  contactPerson?: string | null
  isActive?: boolean
}

export default function Customers() {
  const customers = useCustomers()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm)

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (c: CustomerRow) => {
    setEditingId(c.id)
    setForm({
      code: c.code ?? '',
      name: c.name ?? '',
      eik: c.eik ?? '',
      vatNumber: c.vatNumber ?? '',
      address: c.address ?? '',
      city: c.city ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      contactPerson: c.contactPerson ?? ''
    })
    setShowForm(true)
  }

  const onSave = async () => {
    if (!form.code || !form.name) return
    const payload = {
      code: form.code,
      name: form.name,
      eik: form.eik || undefined,
      vatNumber: form.vatNumber || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      contactPerson: form.contactPerson || undefined
    }
    if (editingId) {
      await updateCustomer.mutateAsync({ id: editingId, ...payload })
    } else {
      await createCustomer.mutateAsync(payload)
    }
    resetForm()
  }

  const isSaving = createCustomer.isPending || updateCustomer.isPending
  const rows = (customers.data ?? []) as CustomerRow[]
  const filtered = search.trim()
    ? rows.filter(
        (c) =>
          c.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.code?.toLowerCase().includes(search.toLowerCase()) ||
          c.eik?.toLowerCase().includes(search.toLowerCase()) ||
          c.email?.toLowerCase().includes(search.toLowerCase()) ||
          c.city?.toLowerCase().includes(search.toLowerCase())
      )
    : rows

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1600 }}>
      <PageHeader
        title="Клиенти"
        subtitle="Управление на клиенти"
        help={{
          title: 'Клиенти',
          content: 'Регистър на клиенти за фактуриране и финансово осчетоводяване (Фаза 2+).'
        }}
        action={!showForm ? <Button onClick={openCreate}>Нов клиент</Button> : undefined}
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
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
            {editingId ? 'Редактиране на клиент' : 'Нов клиент'}
          </div>
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
            <Button variant="secondary" onClick={resetForm}>
              Отказ
            </Button>
            <Button onClick={() => void onSave()} disabled={isSaving}>
              {isSaving ? 'Запис...' : editingId ? 'Запази промените' : 'Създай'}
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
              <th style={financeTableThStyle}>Град</th>
              <th style={financeTableThStyle}>Адрес</th>
              <th style={financeTableThStyle}>Email</th>
              <th style={financeTableThStyle}>Контакт</th>
              <th style={financeTableThStyle}>Телефон</th>
              <th style={financeTableThStyle}>Статус</th>
              <th style={financeTableThStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ ...financeTableTdStyle, color: '#6b7280', textAlign: 'center' }}>
                  Няма клиенти
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr
                  key={c.id}
                  style={{
                    ...financeTableRowStyle,
                    background: editingId === c.id ? '#f0f9ff' : undefined
                  }}
                  onMouseEnter={(e) => {
                    if (editingId !== c.id) e.currentTarget.style.background = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = editingId === c.id ? '#f0f9ff' : 'transparent'
                  }}
                >
                  <td style={{ ...financeTableTdStyle, fontFamily: 'monospace' }}>{c.code}</td>
                  <td style={{ ...financeTableTdStyle, fontWeight: 700 }}>{c.name}</td>
                  <td style={financeTableTdStyle}>{c.eik ?? '—'}</td>
                  <td style={financeTableTdStyle}>{c.vatNumber ?? '—'}</td>
                  <td style={financeTableTdStyle}>{c.city ?? '—'}</td>
                  <td style={financeTableTdStyle}>{c.address ?? '—'}</td>
                  <td style={financeTableTdStyle}>{c.email ?? '—'}</td>
                  <td style={financeTableTdStyle}>{c.contactPerson ?? '—'}</td>
                  <td style={financeTableTdStyle}>{c.phone ?? '—'}</td>
                  <td style={financeTableTdStyle}>{c.isActive ? 'Активен' : 'Неактивен'}</td>
                  <td style={financeTableTdStyle}>
                    <button
                      type="button"
                      title="Редактирай"
                      onClick={() => openEdit(c)}
                      style={{
                        padding: '5px 8px',
                        border: '1px solid #e5e7eb',
                        borderRadius: 6,
                        background: 'white',
                        cursor: 'pointer',
                        color: '#6b7280',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                    >
                      <Edit2 size={13} />
                    </button>
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
