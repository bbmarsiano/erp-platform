import type { PropsWithChildren } from 'react'

export const Badge = ({ children }: PropsWithChildren) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: 9999,
      padding: '2px 10px',
      fontSize: 12,
      backgroundColor: '#e0f2fe',
      color: '#0c4a6e'
    }}
  >
    {children}
  </span>
)
