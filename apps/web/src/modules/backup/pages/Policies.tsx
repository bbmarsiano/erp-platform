import { useCallback, useState } from 'react'
import { Loader } from 'lucide-react'
import { Button, Card, FormField, FormRow, Input, PageHeader, Select, StatusBadge } from '../../../components/ui'
import { useToastStore } from '../../../store/toast.store'
import { useBackupPolicies, useCreateBackupPolicy, useRunPolicy } from '../hooks/useBackup'
import {
  backupTableRowStyle,
  backupTableTdStyle,
  backupTableThStyle,
  cronLabel
} from '../backupUi'

const PATH_HINT_ABSOLUTE =
  'Пътят трябва да е абсолютен (да започва с /). Празно поле — системна директория по подразбиране.'

export default function Policies() {
  const policies = useBackupPolicies()
  const createPolicy = useCreateBackupPolicy()
  const runPolicy = useRunPolicy()
  const showToast = useToastStore((s) => s.show)
  const [showForm, setShowForm] = useState(false)
  const [runningPolicyId, setRunningPolicyId] = useState<string | null>(null)
  const [disabledPolicyIds, setDisabledPolicyIds] = useState<Set<string>>(new Set())
  const [pathError, setPathError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    schedule: '0 2 * * *',
    retentionDays: 30,
    targetType: 'LOCAL' as 'LOCAL' | 'NETWORK' | 'S3',
    targetPath: '',
    isEncrypted: true
  })

  const onCreate = async () => {
    if (!form.name || !form.schedule) return
    setPathError(null)
    try {
      await createPolicy.mutateAsync(form)
    } catch (err: unknown) {
      const apiErr = err as { response?: { status?: number; data?: { error?: string } } }
      const message = apiErr?.response?.data?.error
      if (apiErr?.response?.status === 400 && message) {
        setPathError(message)
        return
      }
      showToast(message ?? 'Грешка при създаване на политика', 'error')
      return
    }
    setShowForm(false)
    setForm({
      name: '',
      schedule: '0 2 * * *',
      retentionDays: 30,
      targetType: 'LOCAL',
      targetPath: '',
      isEncrypted: true
    })
  }

  const handleRunPolicy = useCallback(
    async (policyId: string) => {
      setRunningPolicyId(policyId)
      try {
        await runPolicy.mutateAsync(policyId)
        showToast('Архивирането е стартирано успешно', 'success')
        setDisabledPolicyIds((prev) => new Set(prev).add(policyId))
        setTimeout(() => {
          setDisabledPolicyIds((prev) => {
            const next = new Set(prev)
            next.delete(policyId)
            return next
          })
        }, 5000)
      } catch (err: unknown) {
        const apiErr = err as { response?: { data?: { error?: string } } }
        showToast(apiErr?.response?.data?.error ?? 'Грешка при стартиране на архивиране', 'error')
      } finally {
        setRunningPolicyId(null)
      }
    },
    [runPolicy, showToast]
  )

  const rows = (policies.data ?? []) as Array<any>

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <style>{`@keyframes dflow-spin { to { transform: rotate(360deg); } }`}</style>
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
              <Select
                value={form.targetType}
                onChange={(e) => {
                  const targetType = e.target.value as 'LOCAL' | 'S3'
                  setForm({ ...form, targetType })
                  if (targetType !== 'LOCAL') setPathError(null)
                }}
              >
                <option value="LOCAL">LOCAL</option>
                <option value="S3">S3</option>
              </Select>
            </FormField>
            <FormField label="Път">
              <Input
                value={form.targetPath}
                onChange={(e) => {
                  setForm({ ...form, targetPath: e.target.value })
                  if (pathError && e.target.value.trim()) setPathError(null)
                }}
                placeholder="/opt/dflow-erp/backups/dflow"
              />
              {pathError ? (
                <div style={{ marginTop: 6, fontSize: 12, color: '#dc2626', fontWeight: 500 }}>{pathError}</div>
              ) : form.targetType === 'LOCAL' && form.targetPath.trim() ? (
                <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>{PATH_HINT_ABSOLUTE}</div>
              ) : null}
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
              rows.map((p) => {
                const isRunning = runningPolicyId === p.id
                const isDisabled = disabledPolicyIds.has(p.id) || isRunning
                return (
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
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRunPolicy(p.id)}
                        disabled={isDisabled}
                        icon={
                          isRunning ? (
                            <Loader size={14} style={{ animation: 'dflow-spin 1s linear infinite' }} />
                          ) : undefined
                        }
                      >
                        {isRunning ? 'Стартиране...' : 'Стартирай сега'}
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
