import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
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
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Доставчици</div>
        <Button onClick={() => setShowForm((x) => !x)}>{showForm ? 'Отказ' : 'Нов доставчик'}</Button>
      </div>

      {showForm ? (
        <div
          style={{
            marginTop: 12,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: 14,
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr)) auto',
            gap: 10,
            alignItems: 'end'
          }}
        >
          <input placeholder="Код" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={{ padding: 8 }} />
          <input
            placeholder="Наименование"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ padding: 8 }}
          />
          <input placeholder="Контакт" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} style={{ padding: 8 }} />
          <input placeholder="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ padding: 8 }} />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ padding: 8 }} />
          <Button onClick={onCreate} disabled={createSupplier.isPending}>
            {createSupplier.isPending ? 'Запис...' : 'Създай'}
          </Button>
        </div>
      ) : null}

      <div style={{ marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 10 }}>Код</th>
              <th style={{ padding: 10 }}>Наименование</th>
              <th style={{ padding: 10 }}>Контакт</th>
              <th style={{ padding: 10 }}>Телефон</th>
              <th style={{ padding: 10 }}>Email</th>
              <th style={{ padding: 10 }}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: 10, fontFamily: 'monospace' }}>{s.code}</td>
                <td style={{ padding: 10, fontWeight: 700 }}>{s.name}</td>
                <td style={{ padding: 10 }}>{s.contactName ?? '—'}</td>
                <td style={{ padding: 10 }}>{s.phone ?? '—'}</td>
                <td style={{ padding: 10 }}>{s.email ?? '—'}</td>
                <td style={{ padding: 10 }}>{s.isActive ? 'Активен' : 'Неактивен'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

