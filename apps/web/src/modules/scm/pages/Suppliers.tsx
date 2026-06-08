import { useState } from 'react'
import { Button, Card, FormField, FormRow, Input, PageHeader } from '../../../components/ui'
import { useCreateSupplier, useSuppliers } from '../hooks/useScm'

export default function Suppliers() {
  const suppliers = useSuppliers()
  const createSupplier = useCreateSupplier()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    code: '',
    name: '',
    contactName: '',
    phone: '',
    email: ''
  })

  const onCreate = async () => {
    if (!form.code || !form.name) return
    await createSupplier.mutateAsync({
      code: form.code,
      name: form.name,
      contactName: form.contactName || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined
    })
    setForm({ code: '', name: '', contactName: '', phone: '', email: '' })
    setShowForm(false)
  }

  const rows = (suppliers.data ?? []) as Array<any>

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Доставчици"
        subtitle="Управление на доставчици"
        action={!showForm ? <Button onClick={() => setShowForm(true)}>Нов доставчик</Button> : undefined}
      />

      {showForm ? (
        <Card style={{ marginBottom: 20 }}>
          <FormRow columns={5}>
            <FormField label="Код" required>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SUP-01" />
            </FormField>
            <FormField label="Наименование" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Име на доставчик" />
            </FormField>
            <FormField label="Контакт">
              <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Контактно лице" />
            </FormField>
            <FormField label="Телефон">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+359..." />
            </FormField>
            <FormField label="Email">
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
            </FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Отказ
            </Button>
            <Button onClick={onCreate} disabled={createSupplier.isPending}>
              {createSupplier.isPending ? 'Запис...' : 'Създай'}
            </Button>
          </div>
        </Card>
      ) : null}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Код</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Наименование</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Контакт</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Телефон</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Email</th>
              <th style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }}>{s.code}</td>
                <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13 }}>{s.name}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{s.contactName ?? '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{s.phone ?? '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{s.email ?? '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{s.isActive ? 'Активен' : 'Неактивен'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
