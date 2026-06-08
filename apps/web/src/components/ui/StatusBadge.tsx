interface StatusBadgeProps {
  label: string
  bg: string
  color: string
}

export function StatusBadge({ label, bg, color }: StatusBadgeProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: bg,
        color,
        whiteSpace: 'nowrap',
        lineHeight: 1.4
      }}
    >
      {label}
    </span>
  )
}
