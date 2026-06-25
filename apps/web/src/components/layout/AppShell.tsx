import { useState, useEffect } from 'react'
import { UpdateBanner } from '../UpdateBanner'
import { TrialBanner } from '../TrialBanner'
import { Toast } from '../ui/Toast'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f6f8fa',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      {!isMobile && <Sidebar open={true} onToggle={() => {}} isMobile={false} />}

      {isMobile && mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 99
            }}
          />
          <Sidebar open={true} onToggle={() => setMobileOpen(false)} isMobile={true} />
        </>
      )}

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: isMobile ? 0 : 240,
          minWidth: 0
        }}
      >
        <TopBar onMenuToggle={() => setMobileOpen((o) => !o)} showHamburger={isMobile} />
        <TrialBanner />
        <main style={{ flex: 1, padding: '28px 32px' }}>{children}</main>
      </div>
      <UpdateBanner />
      <Toast />
    </div>
  )
}

export default AppShell
