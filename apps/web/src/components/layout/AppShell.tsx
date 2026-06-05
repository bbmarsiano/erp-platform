import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f6f8fa',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: sidebarOpen ? 240 : 64,
          transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)',
          minWidth: 0
        }}
      >
        <TopBar onMenuToggle={() => setSidebarOpen((o) => !o)} sidebarOpen={sidebarOpen} />
        <main
          style={{
            flex: 1,
            padding: '28px 32px',
            maxWidth: 1400,
            width: '100%',
            margin: '0 auto'
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppShell
