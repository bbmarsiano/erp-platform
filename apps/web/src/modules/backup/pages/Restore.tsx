import { RotateCcw } from 'lucide-react'
import { Button, Card, PageHeader } from '../../../components/ui'
import { useRestorePoints, useTestRestore } from '../hooks/useBackup'
import { EmptyStatePanel } from '../components/EmptyStatePanel'
import { formatBytes, formatDate } from '../backupUi'

export default function Restore() {
  const restorePoints = useRestorePoints()
  const testRestore = useTestRestore()
  const rows = (restorePoints.data ?? []) as Array<any>

  const handleTestRestore = (jobId: string) => {
    testRestore.mutate({ jobId })
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader title="Възстановяване" subtitle="Точки за възстановяване" />

      {restorePoints.isLoading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Зареждане...</div>
      ) : rows.length === 0 ? (
        <EmptyStatePanel
          icon={<RotateCcw size={28} />}
          title="Няма налични точки за възстановяване"
          description="Точките за възстановяване се създават автоматично при успешно архивиране"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              padding: '12px 16px',
              background: '#f8fafc',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              fontSize: 13,
              color: '#6b7280',
              lineHeight: 1.5
            }}
          >
            Точките за възстановяване се създават автоматично при успешно архивиране
          </div>
          {rows.map((job) => (
            <Card key={job.id} padding={20}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                    Архив от {formatDate(job.createdAt)}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
                    Размер: {formatBytes(job.sizeBytes)} · Политика: {job.policy?.name ?? '—'}
                  </div>
                </div>
                <Button variant="secondary" onClick={() => handleTestRestore(job.id)}>
                  Тест на възстановяване
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
