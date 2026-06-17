interface BadgeProps {
  label: string
  bg: string
  color: string
  size?: 'sm' | 'md'
}

export function Badge({ label, bg, color, size = 'sm' }: BadgeProps) {
  return (
    <span style={{
      display: 'inline-block',
      padding: size === 'sm' ? '2px 8px' : '4px 12px',
      borderRadius: 20, fontSize: size === 'sm' ? 11 : 13,
      fontWeight: 600, background: bg, color,
      whiteSpace: 'nowrap' as const,
    }}>
      {label}
    </span>
  )
}
