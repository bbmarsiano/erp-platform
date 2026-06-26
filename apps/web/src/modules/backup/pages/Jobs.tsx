import { History } from 'lucide-react'
import { Button, PageHeader, StatusBadge } from '../../../components/ui'
import { useBackupJobs, useVerifyBackupJob } from '../hooks/useBackup'
import {
  backupTableRowStyle,
  backupTableTdStyle,
  backupTableThStyle,
  formatBytes,
  jobStatusMap
} from '../backupUi'
import { EmptyStatePanel } from '../components/EmptyStatePanel'

export default function Jobs() {
  const jobs = useBackupJobs()
  const verify = useVerifyBackupJob()
  const rows = (jobs.data ?? []) as Array<any>

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader title="История" subtitle="История на архивни задачи" />

      {jobs.isLoading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Зареждане...</div>
      ) : rows.length === 0 ? (
        <EmptyStatePanel icon={<History size={28} />} title="Няма архивни задачи" />
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <th style={backupTableThStyle}>ID</th>
                <th style={backupTableThStyle}>Политика</th>
                <th style={backupTableThStyle}>Статус</th>
                <th style={backupTableThStyle}>Начало</th>
                <th style={backupTableThStyle}>Край</th>
                <th style={backupTableThStyle}>Размер</th>
                <th style={backupTableThStyle}>Верифицирано</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((j) => {
                const st = jobStatusMap[j.status] ?? { label: j.status, bg: '#f3f4f6', color: '#374151' }
                return (
                  <tr
                    key={j.id}
                    style={backupTableRowStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <td style={{ ...backupTableTdStyle, fontFamily: 'monospace', fontSize: 13 }}>{j.id.slice(0, 8)}</td>
                    <td style={backupTableTdStyle}>{j.policy?.name ?? '—'}</td>
                    <td style={backupTableTdStyle}>
                      <StatusBadge label={st.label} bg={st.bg} color={st.color} />
                    </td>
                    <td style={{ ...backupTableTdStyle, color: '#6b7280' }}>
                      {j.startedAt ? new Date(j.startedAt).toLocaleString('bg-BG') : '—'}
                    </td>
                    <td style={{ ...backupTableTdStyle, color: '#6b7280' }}>
                      {j.completedAt ? new Date(j.completedAt).toLocaleString('bg-BG') : '—'}
                    </td>
                    <td style={backupTableTdStyle}>{formatBytes(j.sizeBytes)}</td>
                    <td style={backupTableTdStyle}>
                      {j.isVerified ? (
                        <StatusBadge label="Да" bg="#dcfce7" color="#166534" />
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => verify.mutate(j.id)}>
                          Верифицирай
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
