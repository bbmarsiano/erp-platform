export function PageHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between',
      alignItems: 'flex-start', marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a',
          letterSpacing: '-0.3px', margin: '0 0 4px' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
