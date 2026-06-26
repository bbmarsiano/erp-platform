import type { CSSProperties } from 'react'

export const backupTableThStyle: CSSProperties = {
  padding: '12px 16px',
  fontSize: 11,
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'left'
}

export const backupTableTdStyle: CSSProperties = {
  padding: '12px 16px',
  fontSize: 14
}

export const backupTableRowStyle: CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
  transition: 'background 0.1s'
}

export const jobStatusMap: Record<string, { label: string; bg: string; color: string }> = {
  PENDING: { label: 'Изчакване', bg: '#fef9c3', color: '#854d0e' },
  RUNNING: { label: 'Изпълнява се', bg: '#dbeafe', color: '#1e40af' },
  COMPLETED: { label: 'Завършено', bg: '#dcfce7', color: '#166534' },
  FAILED: { label: 'Грешка', bg: '#fee2e2', color: '#991b1b' },
  VERIFIED: { label: 'Верифицирано', bg: '#f0fdf4', color: '#14532d' }
}

export const cronLabel = (cron: string) => {
  if (cron.trim() === '0 2 * * *') return 'Всеки ден в 02:00'
  return cron
}

export const formatBytes = (bytes?: bigint | number | null) => {
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

export const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleString('bg-BG') : '—')
