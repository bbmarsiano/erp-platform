import type { ReactNode } from 'react'

export function EmptyStatePanel({
  icon,
  title,
  description
}: {
  icon: ReactNode
  title: string
  description?: string
}) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 48,
        textAlign: 'center'
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          borderRadius: 14,
          background: '#f3f4f6',
          color: '#9ca3af',
          marginBottom: 16
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: description ? 8 : 0 }}>{title}</div>
      {description ? (
        <div style={{ fontSize: 14, color: '#9ca3af', maxWidth: 420, margin: '0 auto', lineHeight: 1.5 }}>{description}</div>
      ) : null}
    </div>
  )
}
