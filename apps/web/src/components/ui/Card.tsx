import type { PropsWithChildren } from 'react'

export const Card = ({ children }: PropsWithChildren) => (
  <div
    style={{
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: 16,
      backgroundColor: '#fff'
    }}
  >
    {children}
  </div>
)
