import { useMemo } from 'react'
import { Server } from 'lucide-react'
import { Card, PageHeader, StatusBadge } from '../../../components/ui'
import { useBackupJobs, useBackupPolicies, useBackupStatus } from '../hooks/useBackup'

function StatCard({
  title,
  value,
  valueColor
}: {
  title: string
  value: string | number
  valueColor?: string
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: '18px 20px'
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 8
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: valueColor || '#0f172a',
          letterSpacing: '-0.5px',
          lineHeight: 1.2
        }}
      >
        {value}
      </div>
    </div>
  )
}

export default function BackupDashboard() {
  const policiesQuery = useBackupPolicies()
  const jobsQuery = useBackupJobs()
  const statusQuery = useBackupStatus()

  const stats = useMemo(() => {
    const policies = (policiesQuery.data ?? []) as Array<any>
    const jobs = (jobsQuery.data ?? []) as Array<any>
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    const completed = jobs.filter((j) => j.status === 'COMPLETED' || j.status === 'VERIFIED')
    const lastCompleted = completed.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0]
    const agentRunning = jobs.some((j) => j.status === 'RUNNING')
    const agentConnected = statusQuery.data?.connected ?? true
    return {
      activePolicies: policies.filter((p) => p.isActive).length,
      lastBackup: lastCompleted ? new Date(lastCompleted.createdAt).toLocaleString('bg-BG') : 'Няма',
      successWeek: jobs.filter(
        (j) => (j.status === 'COMPLETED' || j.status === 'VERIFIED') && new Date(j.createdAt) >= weekStart
      ).length,
      failedWeek: jobs.filter((j) => j.status === 'FAILED' && new Date(j.createdAt) >= weekStart).length,
      agentConnected,
      agentRunning,
      agentMessage: statusQuery.data?.message ?? 'Backup агентът е готов'
    }
  }, [jobsQuery.data, policiesQuery.data, statusQuery.data])

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <PageHeader title="Архивиране" subtitle="Обзор на архивирането" />

      <div
        style={{
          marginTop: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 12
        }}
      >
        <StatCard title="Активни политики" value={stats.activePolicies} />
        <StatCard title="Последно архивиране" value={stats.lastBackup} />
        <StatCard title="Успешни тази седмица" value={stats.successWeek} valueColor="#16a34a" />
        <StatCard
          title="Неуспешни"
          value={stats.failedWeek}
          valueColor={stats.failedWeek > 0 ? '#dc2626' : undefined}
        />
      </div>

      <Card style={{ marginTop: 20, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: !stats.agentConnected ? '#fef2f2' : stats.agentRunning ? '#f0fdf4' : '#f0fdf4',
                color: !stats.agentConnected ? '#dc2626' : '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Server size={22} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Backup агент</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                {stats.agentRunning
                  ? 'Агентът изпълнява архивни задачи'
                  : stats.agentMessage}
              </div>
            </div>
          </div>
          <StatusBadge
            label={
              !stats.agentConnected
                ? 'Недостъпен'
                : stats.agentRunning
                  ? 'Активен'
                  : 'Готов'
            }
            bg={!stats.agentConnected ? '#fee2e2' : stats.agentRunning ? '#dcfce7' : '#dcfce7'}
            color={!stats.agentConnected ? '#991b1b' : '#166534'}
          />
        </div>
      </Card>
    </div>
  )
}
