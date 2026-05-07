import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { useBackupPolicies, useCreateBackupPolicy, useRunPolicy } from '../hooks/useBackup'

const cronLabel = (cron: string) => {
  if (cron.trim() === '0 2 * * *') return 'Всеки ден в 02:00'
  return cron
}

export default function Policies() {
  const policies = useBackupPolicies()
  const createPolicy = useCreateBackupPolicy()
  const runPolicy = useRunPolicy()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    schedule: '0 2 * * *',
    retentionDays: 30,
    targetType: 'LOCAL' as 'LOCAL' | 'NETWORK' | 'S3',
    targetPath: '/backups/dflow',
    isEncrypted: true
  })

  const onCreate = async () => {
    if (!form.name || !form.schedule) return
    await createPolicy.mutateAsync(form)
    setShowForm(false)
    setForm({
      name: '',
      schedule: '0 2 * * *',
      retentionDays: 30,
      targetType: 'LOCAL',
      targetPath: '/backups/dflow',
      isEncrypted: true
    })
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Политики</div>
        <Button onClick={() => setShowForm((x) => !x)}>{showForm ? 'Отказ' : 'Нова политика'}</Button>
      </div>
      {showForm ? (
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 120px 120px 1fr auto', gap: 8, alignItems: 'end' }}>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Наименование" style={{ padding: 8 }} />
          <input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Cron" style={{ padding: 8 }} />
          <input type="number" value={form.retentionDays} onChange={(e) => setForm({ ...form, retentionDays: Number(e.target.value) })} style={{ padding: 8 }} />
          <select value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value as any })} style={{ padding: 8 }}>
            <option value="LOCAL">LOCAL</option>
            <option value="NETWORK">NETWORK</option>
            <option value="S3">S3</option>
          </select>
          <input value={form.targetPath} onChange={(e) => setForm({ ...form, targetPath: e.target.value })} placeholder="Път/target" style={{ padding: 8 }} />
          <Button onClick={onCreate}>Създай</Button>
        </div>
      ) : null}
      <div style={{ marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 10 }}>Наименование</th>
              <th style={{ padding: 10 }}>График</th>
              <th style={{ padding: 10 }}>Задържане (дни)</th>
              <th style={{ padding: 10 }}>Цел</th>
              <th style={{ padding: 10 }}>Криптиране</th>
              <th style={{ padding: 10 }}>Статус</th>
              <th style={{ padding: 10 }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {((policies.data ?? []) as Array<any>).map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: 10 }}>{p.name}</td>
                <td style={{ padding: 10 }}>{cronLabel(p.schedule)}</td>
                <td style={{ padding: 10 }}>{p.retentionDays}</td>
                <td style={{ padding: 10 }}>{p.targetType}</td>
                <td style={{ padding: 10 }}>{p.isEncrypted ? 'Да' : 'Не'}</td>
                <td style={{ padding: 10 }}>{p.isActive ? 'Активна' : 'Неактивна'}</td>
                <td style={{ padding: 10 }}>
                  <Button onClick={() => runPolicy.mutate(p.id)} style={{ background: '#fff', border: '1px solid #ddd', color: '#111' }}>
                    Стартирай сега
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

