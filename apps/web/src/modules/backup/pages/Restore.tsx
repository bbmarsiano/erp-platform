import { Button, PageHeader } from '../../../components/ui'
import { useRestorePoints, useTestRestore } from '../hooks/useBackup'

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleString('bg-BG') : '—')
const formatBytes = (bytes?: bigint | number | null) => {
  if (!bytes) return '—'
  const b = Number(bytes)
  if (!Number.isFinite(b) || b <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let val = b
  let i = 0
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024
    i += 1
  }
  return `${val.toFixed(1)} ${units[i]}`
}

export default function Restore() {
  const restorePoints = useRestorePoints()
  const testRestore = useTestRestore()

  const handleTestRestore = (jobId: string) => {
    testRestore.mutate({ jobId, note: 'Ръчен тест на възстановяване от UI' })
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader title="Възстановяване" subtitle="Точки за възстановяване" />
      <div style={{ marginTop: 14 }}>
        {((restorePoints.data ?? []) as Array<any>).map((job) => (
          <div key={job.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 8, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Архив от {formatDate(job.createdAt)}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>
                  Размер: {formatBytes(job.sizeBytes)} · Политика: {job.policy?.name ?? '—'}
                </div>
              </div>
              <Button variant="secondary" onClick={() => handleTestRestore(job.id)}>
                Тест на възстановяване
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

