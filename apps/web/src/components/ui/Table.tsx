interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
  width?: number | string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  emptyMessage?: string
  keyField?: keyof T
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'Няма данни',
  keyField = 'id' as keyof T
}: TableProps<T>) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        overflow: 'hidden'
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '11px 16px',
                  textAlign: 'left',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#6b7280',
                  width: col.width
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!data.length ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ padding: 48, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={String(row[keyField] ?? i)}
                onClick={() => onRowClick?.(row)}
                style={{
                  borderBottom: '1px solid #f3f4f6',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) (e.currentTarget as HTMLElement).style.background = '#fafafa'
                }}
                onMouseLeave={(e) => {
                  if (onRowClick) (e.currentTarget as HTMLElement).style.background = 'white'
                }}
              >
                {columns.map((col) => (
                  <td key={col.key} style={{ padding: '12px 16px', fontSize: 13 }}>
                    {col.render ? col.render(row) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
