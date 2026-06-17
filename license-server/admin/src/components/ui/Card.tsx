export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 12, padding: 24,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      ...style
    }}>
      {children}
    </div>
  )
}
