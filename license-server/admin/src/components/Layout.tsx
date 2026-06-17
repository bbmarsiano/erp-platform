import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Key, LogOut,
  Zap, DollarSign
} from 'lucide-react'

const navItems = [
  { path: '/dashboard',  label: 'Табло',              icon: <LayoutDashboard size={17} /> },
  { path: '/tenants',    label: 'Клиенти',             icon: <Users size={17} /> },
  { path: '/licenses',   label: 'Лицензи',             icon: <Key size={17} /> },
  { path: '/generate',   label: 'Нов лиценз',          icon: <Zap size={17} /> },
  { path: '/pricing',    label: 'Ценова конфигурация', icon: <DollarSign size={17} /> },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  const handleLogout = () => {
    sessionStorage.removeItem('dflow_admin_auth')
    window.location.reload()
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f8fa' }}>
      <div style={{
        width: 240, background: '#0f172a', display: 'flex',
        flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0,
        zIndex: 10
      }}>
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(124,58,237,0.4)', fontSize: 16
            }}>⚡</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>DFlowERP</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                License Admin
              </div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {navItems.map(item => {
            const active = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                  background: active ? 'rgba(124,58,237,0.25)' : 'transparent',
                  color: active ? '#a78bfa' : 'rgba(255,255,255,0.55)',
                  transition: 'all 0.15s', cursor: 'pointer',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  borderLeft: active ? '2px solid #7c3aed' : '2px solid transparent',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}>
                  {item.icon}
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button type="button" onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 8, border: 'none',
            background: 'transparent', cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)', fontSize: 13,
            transition: 'all 0.15s', fontFamily: 'inherit'
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.15)'
            ;(e.currentTarget as HTMLElement).style.color = '#fca5a5'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'
          }}>
            <LogOut size={16} />
            Изход
          </button>
        </div>
      </div>

      <div style={{ flex: 1, marginLeft: 240 }}>
        <div style={{
          height: 56, background: '#fff', borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 28px', position: 'sticky', top: 0, zIndex: 9,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff'
            }}>A</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Admin</span>
          </div>
        </div>

        <main style={{ padding: '28px 32px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
