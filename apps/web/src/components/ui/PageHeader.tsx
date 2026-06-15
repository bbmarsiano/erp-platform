import { HelpTooltip } from './HelpTooltip'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  help?: {
    title: string
    content: string
    position?: 'top' | 'bottom' | 'left' | 'right'
  }
}

export function PageHeader({ title, subtitle, action, help }: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: subtitle ? 4 : 0 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              margin: 0,
              color: '#0f172a',
              letterSpacing: '-0.3px'
            }}
          >
            {title}
          </h1>
          {help && (
            <HelpTooltip
              title={help.title}
              content={help.content}
              position={help.position}
            />
          )}
        </div>
        {subtitle && <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
