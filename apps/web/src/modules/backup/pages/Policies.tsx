import { useState } from 'react'
import { Button, Card, FormField, FormRow, Input, PageHeader, Select, StatusBadge } from '../../../components/ui'
import { useBackupPolicies, useCreateBackupPolicy, useRunPolicy } from '../hooks/useBackup'
import {
  backupTableRowStyle,
  backupTableTdStyle,
  backupTableThStyle,
  cronLabel
} from '../backupUi'

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

  const rows = (policies.data ?? []) as Array<any>

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader
        title="Политики"
        subtitle="Управление на политики за архивиране"
        help={{
          title: 'Политики за архивиране',
          content:
            'Политиката определя кога автоматично да се архивират данните. Препоръчва се дневно архивиране за защита от загуба на данни.'
        }}
        action={!showForm ? <Button onClick={() => setShowForm(true)}>Нова политика</Button> : undefined}
      />

      {showForm ? (
        <Card style={{ marginBottom: 20 }}>
          <FormRow columns={3}>
            <FormField label="Наименование" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Дневно архивиране"
              />
            </FormField>
            <FormField label="График (cron)" required>
              <Input
                value={form.schedule}
                onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                placeholder="0 2 * * *"
              />
            </FormField>
            <FormField label="Задържане (дни)" required>
              <Input
                type="number"
                value={form.retentionDays}
                onChange={(e) => setForm({ ...form, retentionDays: Number(e.target.value) })}
                min={1}
              />
            </FormField>
          </FormRow>
          <FormRow columns={2}>
            <FormField label="Цел" required>
              <Select value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value as any })}>
                <option value="LOCAL">LOCAL</option>
                <option value="S3">S3</option>
              </Select>
            </FormField>
            <FormField label="Път" required>
              <Input
                value={form.targetPath}
                onChange={(e) => setForm({ ...form, targetPath: e.target.value })}
                placeholder="/backups/dflow"
              />
            </FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Отказ
            </Button>
            <Button onClick={onCreate} disabled={createPolicy.isPending}>
              {createPolicy.isPending ? 'Запис...' : 'Създай'}
            </Button>
          </div>
        </Card>
      ) : null}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <th style={backupTableThStyle}>Наименование</th>
              <th style={backupTableThStyle}>График</th>
              <th style={backupTableThStyle}>Задържане (дни)</th>
              <th style={backupTableThStyle}>Цел</th>
              <th style={backupTableThStyle}>Криптиране</th>
              <th style={backupTableThStyle}>Статус</th>
              <th style={backupTableThStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...backupTableTdStyle, color: '#6b7280', textAlign: 'center' }}>
                  Няма политики
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr
                  key={p.id}
                  style={backupTableRowStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <td style={{ ...backupTableTdStyle, fontWeight: 700 }}>{p.name}</td>
                  <td style={backupTableTdStyle}>{cronLabel(p.schedule)}</td>
                  <td style={backupTableTdStyle}>{p.retentionDays}</td>
                  <td style={backupTableTdStyle}>{p.targetType}</td>
                  <td style={backupTableTdStyle}>{p.isEncrypted ? 'Да' : 'Не'}</td>
                  <td style={backupTableTdStyle}>
                    <StatusBadge
                      label={p.isActive ? 'Активна' : 'Неактивна'}
                      bg={p.isActive ? '#dcfce7' : '#f3f4f6'}
                      color={p.isActive ? '#166534' : '#6b7280'}
                    />
                  </td>
                  <td style={backupTableTdStyle}>
                    <Button variant="secondary" size="sm" onClick={() => runPolicy.mutate(p.id)}>
                      Стартирай сега
                    </Button>
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
