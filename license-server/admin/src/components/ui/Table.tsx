interface Column {
  key: string
  label: string
  width?: string | number
}

export function Table({ columns, children, emptyMessage = 'Няма данни' }: {
  columns: Column[]
  children: React.ReactNode
  emptyMessage?: string
}) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0)

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
            {columns.map(col => (
              <th key={col.key} style={{
                padding: '12px 16px', textAlign: 'left',
                fontSize: 11, fontWeight: 700, color: '#6b7280',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                width: col.width
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isEmpty ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                {emptyMessage}
              </td>
            </tr>
          ) : children}
        </tbody>
      </table>
    </div>
  )
}

export function TableRow({ children, onClick }: {
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: '1px solid #f3f4f6',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.background = '#fafafa' }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLElement).style.background = '#fff' }}
    >
      {children}
    </tr>
  )
}

export function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td style={{ padding: '13px 16px', fontSize: 13, ...style }}>
      {children}
    </td>
  )
}
