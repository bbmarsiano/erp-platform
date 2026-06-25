export const poStatusMap: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: 'Чернова', bg: '#f3f4f6', color: '#374151' },
  SENT: { label: 'Изпратена', bg: '#ede9fe', color: '#5b21b6' },
  PARTIALLY_RECEIVED: { label: 'Частично получена', bg: '#fed7aa', color: '#9a3412' },
  RECEIVED: { label: 'Получена', bg: '#dcfce7', color: '#166534' },
  CANCELLED: { label: 'Анулирана', bg: '#fee2e2', color: '#991b1b' }
}

export const poTableThStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 11,
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'left'
}

export const poTableTdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 14
}

export const poTableRowStyle: React.CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
  transition: 'background 0.1s'
}
