import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { moduleRegistry } from '../../lib/moduleRegistry'
import { useAuthStore } from '../../store/auth.store'
import { Button } from '../ui/Button'

const staticNav = [
  { label: 'Табло', path: '/dashboard' }
]

export const Sidebar = () => {
  const navigate = useNavigate()
  const modules = useMemo(() => moduleRegistry.getModules(), [])
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const baseLinkStyle: CSSProperties = {
    display: 'block',
    padding: '8px 10px',
    borderRadius: 8,
    textDecoration: 'none',
    color: '#111827'
  }

  return (
    <aside
      style={{
        width: 240,
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        padding: 16,
        gap: 16
      }}
    >
      <strong style={{ fontSize: 20 }}>DFlowERP</strong>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {staticNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              ...baseLinkStyle,
              background: isActive ? '#111827' : 'transparent',
              color: isActive ? '#ffffff' : '#111827'
            })}
          >
            {item.label}
          </NavLink>
        ))}

        {modules.map((module) => (
          <div key={module.id} style={{ marginTop: 6 }}>
            <button
              onClick={() => setCollapsed((prev) => ({ ...prev, [module.id]: !prev[module.id] }))}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                background: '#f9fafb',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              {module.name}
            </button>
            {!collapsed[module.id] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                {module.navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    style={({ isActive }) => ({
                      ...baseLinkStyle,
                      marginLeft: 10,
                      background: isActive ? '#eef2ff' : 'transparent',
                      color: isActive ? '#3730a3' : '#111827'
                    })}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', fontSize: 12, color: '#4b5563' }}>
        <div>{user?.email ?? 'anonymous@local'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          <NavLink
            to="/settings"
            style={({ isActive }) => ({
              ...baseLinkStyle,
              background: isActive ? '#eef2ff' : 'transparent',
              color: isActive ? '#3730a3' : '#111827'
            })}
          >
            Настройки
          </NavLink>
          <Button onClick={handleLogout} style={{ width: '100%' }}>
            Изход
          </Button>
        </div>
      </div>
    </aside>
  )
}
