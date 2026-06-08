interface CardProps {
  children: React.ReactNode
  padding?: number
  style?: React.CSSProperties
}

export function Card({ children, padding = 24, style }: CardProps) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding,
        ...style
      }}
    >
      {children}
    </div>
  )
}
