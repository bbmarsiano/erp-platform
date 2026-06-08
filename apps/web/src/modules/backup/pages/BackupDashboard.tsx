import { useMemo } from 'react'
import { PageHeader } from '../../../components/ui'
import { useBackupJobs, useBackupPolicies } from '../hooks/useBackup'

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }}>
      <div style={{ color: '#6b7280', fontSize: 12, fontWeight: 700 }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 26, fontWeight: 900 }}>{value}</div>
    </div>
  )
}

export default function BackupDashboard() {
  const policiesQuery = useBackupPolicies()
  const jobsQuery = useBackupJobs()
  const stats = useMemo(() => {
    const policies = (policiesQuery.data ?? []) as Array<any>
    const jobs = (jobsQuery.data ?? []) as Array<any>
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    const completed = jobs.filter((j) => j.status === 'COMPLETED')
    const lastCompleted = completed.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0]
    return {
      activePolicies: policies.filter((p) => p.isActive).length,
      lastBackup: lastCompleted ? new Date(lastCompleted.createdAt).toLocaleString('bg-BG') : 'Няма',
      successWeek: jobs.filter((j) => j.status === 'COMPLETED' && new Date(j.createdAt) >= weekStart).length,
      failedWeek: jobs.filter((j) => j.status === 'FAILED' && new Date(j.createdAt) >= weekStart).length
    }
  }, [jobsQuery.data, policiesQuery.data])

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader title="Архивиране" subtitle="Обзор на архивирането" />
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        <Card title="Активни политики" value={stats.activePolicies} />
        <Card title="Последно архивиране" value={stats.lastBackup} />
        <Card title="Успешни тази седмица" value={stats.successWeek} />
        <Card title="Неуспешни тази седмица" value={stats.failedWeek} />
      </div>
      <div style={{ marginTop: 20, padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>🟢 Backup агент</div>
        <div style={{ fontSize: 13, color: '#166534' }}>Конфигуриран — очаква свързване с Go daemon</div>
      </div>
    </div>
  )
}

