import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, FormField, FormRow, Input, PageHeader } from '../../../components/ui'
import { useCounterparties, useCreateCounterparty } from '../hooks/usePos'

const tableTh: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: 11,
  fontWeight: 700,
  color: '#6b7280',
  borderBottom: '1px solid #e5e7eb'
}

const tableTd: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 13,
  borderBottom: '1px solid #f3f4f6'
}

export default function Counterparties() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const counterparties = useCounterparties(true, search)
  const createCounterparty = useCreateCounterparty()
  const [form, setForm] = useState({
    name: '',
    eik: '',
    vatNumber: '',
    address: '',
    city: '',
    contactPerson: '',
    phone: '',
    email: ''
  })

  const onCreate = async () => {
    if (!form.name.trim() || !form.eik.trim()) return
    await createCounterparty.mutateAsync({
      name: form.name.trim(),
      eik: form.eik.trim(),
      vatNumber: form.vatNumber || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      contactPerson: form.contactPerson || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined
    })
    setForm({ name: '', eik: '', vatNumber: '', address: '', city: '', contactPerson: '', phone: '', email: '' })
    setShowForm(false)
  }

  const rows = (counterparties.data ?? []) as Array<any>

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Контрагенти"
        subtitle="Управление на контрагенти за POS фактуриране"
        action={!showForm ? <Button onClick={() => setShowForm(true)}>Нов контрагент</Button> : undefined}
      />

      <div style={{ marginBottom: 16 }}>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Търсене по име или ЕИК..."
          style={{ maxWidth: 360 }}
        />
      </div>

      {showForm ? (
        <Card style={{ marginBottom: 20 }}>
          <FormRow columns={2}>
            <FormField label="Наименование" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </FormField>
            <FormField label="ЕИК" required>
              <Input value={form.eik} onChange={(e) => setForm({ ...form, eik: e.target.value })} />
            </FormField>
          </FormRow>
          <FormRow columns={3}>
            <FormField label="ДДС номер">
              <Input value={form.vatNumber} onChange={(e) => setForm({ ...form, vatNumber: e.target.value })} />
            </FormField>
            <FormField label="Град">
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </FormField>
            <FormField label="МОЛ">
              <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
            </FormField>
          </FormRow>
          <FormRow columns={2}>
            <FormField label="Адрес">
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </FormField>
            <FormField label="Телефон">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </FormField>
          </FormRow>
          <FormField label="Имейл">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormField>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button onClick={onCreate} disabled={createCounterparty.isPending}>
              Запази
            </Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Отказ
            </Button>
          </div>
        </Card>
      ) : null}

      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={tableTh}>Код</th>
              <th style={tableTh}>Наименование</th>
              <th style={tableTh}>ЕИК</th>
              <th style={tableTh}>ДДС номер</th>
              <th style={tableTh}>Телефон</th>
              <th style={tableTh}>Статус</th>
              <th style={tableTh}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={tableTd}>{row.code}</td>
                <td style={tableTd}>{row.name}</td>
                <td style={tableTd}>{row.eik || '—'}</td>
                <td style={tableTd}>{row.vatNumber || '—'}</td>
                <td style={tableTd}>{row.phone || '—'}</td>
                <td style={tableTd}>{row.isActive ? 'Активен' : 'Неактивен'}</td>
                <td style={tableTd}>
                  <Button variant="secondary" onClick={() => navigate(`/pos/counterparties/${row.id}`)}>
                    Преглед
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
