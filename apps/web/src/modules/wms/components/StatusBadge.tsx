const statusMap = {
  DRAFT: { label: 'Чернова', bg: '#fef9c3', color: '#854d0e' },
  CONFIRMED: { label: 'Потвърден', bg: '#dcfce7', color: '#166534' },
  CANCELLED: { label: 'Анулиран', bg: '#fee2e2', color: '#991b1b' }
}

export function StatusBadge({ status }: { status: string }) {
  const s =
    statusMap[status as keyof typeof statusMap] ?? ({ label: status, bg: '#f3f4f6', color: '#374151' } as const)
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: s.bg,
        color: s.color,
        whiteSpace: 'nowrap',
        lineHeight: 1.4
      }}
    >
      {s.label}
    </span>
  )
}

