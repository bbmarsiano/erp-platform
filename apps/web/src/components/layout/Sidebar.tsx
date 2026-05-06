import { useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { moduleRegistry } from '../../lib/moduleRegistry'
import { useAuthStore } from '../../store/auth.store'
import { Button } from '../ui/Button'

const staticNav = [
  { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Settings', path: '/settings', icon: 'Settings' }
]

export const Sidebar = () => {
  const navigate = useNavigate()
  const moduleGroups = useMemo(() => moduleRegistry.getNavItems(), [])
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
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
          <NavLink key={item.path} to={item.path}>
            {item.label}
          </NavLink>
        ))}

        {moduleGroups.map((group) => (
          <div key={group.moduleId}>
            <button onClick={() => setCollapsed((prev) => ({ ...prev, [group.moduleId]: !prev[group.moduleId] }))}>
              {group.moduleName}
            </button>
            {!collapsed[group.moduleId] &&
              group.items.map((item) => (
                <NavLink key={item.path} to={item.path} style={{ display: 'block', marginLeft: 12 }}>
                  {item.label}
                </NavLink>
              ))}
          </div>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', fontSize: 12, color: '#4b5563' }}>
        <div>{user?.email ?? 'anonymous@local'}</div>
        <Button onClick={handleLogout} style={{ marginTop: 8, width: '100%' }}>
          Logout
        </Button>
      </div>
    </aside>
  )
}
