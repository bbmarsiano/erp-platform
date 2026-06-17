import { FormEvent, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase, Tenant } from '../lib/supabase'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Table, TableRow, Td } from '../components/ui/Table'

const emptyTenant = {
  name: '',
  company: '',
  email: '',
  plan: 'standard',
  notes: ''
}

const fieldStyle: React.CSSProperties = {
  padding: '9px 12px',
  border: '1.5px solid #e5e7eb',
  borderRadius: 8,
  fontSize: 13,
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none'
}

const columns = [
  { key: 'name', label: 'Клиент' },
  { key: 'company', label: 'Компания' },
  { key: 'email', label: 'Имейл' },
  { key: 'plan', label: 'План' },
  { key: 'status', label: 'Статус' },
  { key: 'date', label: 'Дата' },
  { key: 'action', label: 'Действие' },
]

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
      <PageHeader
        title="Клиенти"
        subtitle="Управление на клиенти и абонаменти"
      />

      <Card style={{ marginBottom: 24 }}>
        <form onSubmit={createTenant}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
            Нов клиент
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
            <input placeholder="Клиент" required value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} style={fieldStyle} />
            <input placeholder="Компания" value={form.company} onChange={(e) => setForm((s) => ({ ...s, company: e.target.value }))} style={fieldStyle} />
            <input placeholder="Имейл" required type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} style={fieldStyle} />
            <input placeholder="План" value={form.plan} onChange={(e) => setForm((s) => ({ ...s, plan: e.target.value }))} style={fieldStyle} />
            <input placeholder="Бележки" value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} style={fieldStyle} />
          </div>
          <Button type="submit" icon={<Plus size={14} />}>Добави</Button>
        </form>
      </Card>

      <Table columns={columns} emptyMessage="Няма клиенти">
        {tenants.map((tenant) => (
          <TableRow key={tenant.id}>
            <Td><span style={{ fontWeight: 600 }}>{tenant.name}</span></Td>
            <Td>{tenant.company || '—'}</Td>
            <Td>{tenant.email}</Td>
            <Td>{tenant.plan}</Td>
            <Td>
              <Badge
                label={tenant.is_active ? 'Активен' : 'Неактивен'}
                bg={tenant.is_active ? '#dcfce7' : '#fee2e2'}
                color={tenant.is_active ? '#166534' : '#991b1b'}
              />
            </Td>
            <Td style={{ color: '#6b7280' }}>{new Date(tenant.created_at).toLocaleDateString('bg-BG')}</Td>
            <Td>
              <Button
                size="sm"
                variant={tenant.is_active ? 'danger' : 'success'}
                onClick={() => void toggleStatus(tenant)}
              >
                {tenant.is_active ? 'Деактивирай' : 'Активирай'}
              </Button>
            </Td>
          </TableRow>
        ))}
      </Table>
    </div>
  )
}
