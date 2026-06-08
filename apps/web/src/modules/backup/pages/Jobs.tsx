import { Button, PageHeader } from '../../../components/ui'
import { useBackupJobs, useVerifyBackupJob } from '../hooks/useBackup'

const jobStatusMap: Record<string, { label: string; bg: string; color: string }> = {
  PENDING: { label: 'Изчакване', bg: '#fef9c3', color: '#854d0e' },
  RUNNING: { label: 'Изпълнява се', bg: '#dbeafe', color: '#1e40af' },
  COMPLETED: { label: 'Завършено', bg: '#dcfce7', color: '#166534' },
  FAILED: { label: 'Грешка', bg: '#fee2e2', color: '#991b1b' },
  VERIFIED: { label: 'Верифицирано', bg: '#f0fdf4', color: '#14532d' }
}

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

export default function Jobs() {
  const jobs = useBackupJobs()
  const verify = useVerifyBackupJob()
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader title="История" subtitle="История на архивни задачи" />
      <div style={{ marginTop: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: 10 }}>ID</th>
              <th style={{ padding: 10 }}>Политика</th>
              <th style={{ padding: 10 }}>Статус</th>
              <th style={{ padding: 10 }}>Начало</th>
              <th style={{ padding: 10 }}>Край</th>
              <th style={{ padding: 10 }}>Размер</th>
              <th style={{ padding: 10 }}>Верифицирано</th>
            </tr>
          </thead>
          <tbody>
            {((jobs.data ?? []) as Array<any>).map((j) => (
              <tr key={j.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: 10, fontFamily: 'monospace' }}>{j.id.slice(0, 8)}</td>
                <td style={{ padding: 10 }}>{j.policy?.name ?? '—'}</td>
                <td style={{ padding: 10 }}>
                  <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: jobStatusMap[j.status]?.bg, color: jobStatusMap[j.status]?.color }}>
                    {jobStatusMap[j.status]?.label ?? j.status}
                  </span>
                </td>
                <td style={{ padding: 10 }}>{j.startedAt ? new Date(j.startedAt).toLocaleString('bg-BG') : '—'}</td>
                <td style={{ padding: 10 }}>{j.completedAt ? new Date(j.completedAt).toLocaleString('bg-BG') : '—'}</td>
                <td style={{ padding: 10 }}>{formatBytes(j.sizeBytes)}</td>
                <td style={{ padding: 10 }}>
                  {j.isVerified ? (
                    'Да'
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => verify.mutate(j.id)}>
                      Верифицирай
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

