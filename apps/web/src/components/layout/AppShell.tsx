import type { PropsWithChildren } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export const AppShell = ({ children }: PropsWithChildren) => (
  <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
    <Sidebar />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  </div>
)
