import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../../lib/api'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Табло',
  '/users': 'Потребители',
  '/settings': 'Настройки',
  '/wms': 'Складово стопанство',
  '/scm': 'Верига на доставките',
  '/mes': 'Производство',
  '/pos': 'Точка на продажба',
  '/backup': 'Архивиране'
}

function getPageTitle(pathname: string): string {
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname === path || (path !== '/dashboard' && pathname.startsWith(path))) {
      return title
    }
  }
  return 'DFlowERP'
}

export function TopBar({
  onMenuToggle,
  showHamburger
}: {
  onMenuToggle: () => void
  showHamburger: boolean
}) {
  const location = useLocation()
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    api
      .get('/api/tenant')
      .then((r) => {
        if (r.data.data?.name) setCompanyName(r.data.data.name)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (companyName) {
      document.title = `${companyName} — ERP`
    }
  }, [companyName])

  return (
    <div
      style={{
        height: 56,
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {showHamburger && (
          <button
            onClick={onMenuToggle}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 6,
              color: '#6b7280',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              transition: 'background 0.15s'
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 16,
                  height: 2,
                  background: '#6b7280',
                  borderRadius: 1
                }}
              />
            ))}
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {companyName && (
            <>
              <span style={{ fontSize: 13, color: '#9ca3af' }}>{companyName}</span>
              <span style={{ color: '#d1d5db', fontSize: 13 }}>/</span>
            </>
          )}
          <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
            {getPageTitle(location.pathname)}
          </span>
        </div>
      </div>
      <span style={{ fontSize: 11, color: '#d1d5db', fontFamily: 'monospace' }}>v0.1.0</span>
    </div>
  )
}
