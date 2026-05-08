import { FormEvent, useEffect, useState } from 'react'
import { supabase, Tenant } from '../lib/supabase'

const emptyTenant = {
  name: '',
  company: '',
  email: '',
  plan: 'standard',
  notes: ''
}

export default function Tenants() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [form, setForm] = useState(emptyTenant)

  const loadTenants = async () => {
    const { data } = await supabase.from('tenants').select('*').order('created_at', { ascending: false })
    setTenants((data as Tenant[]) ?? [])
  }

  useEffect(() => {
    void loadTenants()
  }, [])

  const createTenant = async (e: FormEvent) => {
    e.preventDefault()
    await supabase.from('tenants').insert({
      ...form,
      is_active: true
    })
    setForm(emptyTenant)
    await loadTenants()
  }

  const toggleStatus = async (tenant: Tenant) => {
    await supabase.from('tenants').update({ is_active: !tenant.is_active }).eq('id', tenant.id)
    await loadTenants()
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Клиенти</h1>

      <form onSubmit={createTenant} style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 4 }}>Нов клиент</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 }}>
          <input placeholder="Клиент" required value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          <input placeholder="Компания" value={form.company} onChange={(e) => setForm((s) => ({ ...s, company: e.target.value }))} />
          <input placeholder="Имейл" required type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
          <input placeholder="План" value={form.plan} onChange={(e) => setForm((s) => ({ ...s, plan: e.target.value }))} />
          <input placeholder="Бележки" value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
        </div>
        <div>
          <button type="submit">Добави</button>
        </div>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Клиент</th>
            <th align="left">Компания</th>
            <th align="left">Имейл</th>
            <th align="left">План</th>
            <th align="left">Статус</th>
            <th align="left">Дата</th>
            <th align="left">Действие</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr key={tenant.id}>
              <td>{tenant.name}</td>
              <td>{tenant.company}</td>
              <td>{tenant.email}</td>
              <td>{tenant.plan}</td>
              <td>{tenant.is_active ? 'Активен' : 'Неактивен'}</td>
              <td>{new Date(tenant.created_at).toLocaleDateString('bg-BG')}</td>
              <td>
                <button onClick={() => void toggleStatus(tenant)}>
                  {tenant.is_active ? 'Деактивирай' : 'Активирай'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

