import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { api } from '../../lib/api'

interface NavItem {
  label: string
  path: string
}
interface NavGroup {
  id: string
  label: string
  icon: string
  items: NavItem[]
  basePath: string
}

const navGroups: NavGroup[] = [
  {
    id: 'wms',
    label: 'Складово стопанство',
    icon: '🏭',
    basePath: '/wms',
    items: [
      { label: 'Табло', path: '/wms' },
      { label: 'Складове', path: '/wms/warehouses' },
      { label: 'Наличности', path: '/wms/stock' },
      { label: 'Приемане', path: '/wms/receipts' },
      { label: 'Изпращане', path: '/wms/issues' },
      { label: 'Движения', path: '/wms/movements' },
      { label: 'Справки', path: '/wms/reports' }
    ]
  },
  {
    id: 'scm',
    label: 'Верига на доставките',
    icon: '🚚',
    basePath: '/scm',
    items: [
      { label: 'Табло', path: '/scm' },
      { label: 'Доставчици', path: '/scm/suppliers' },
      { label: 'Поръчки покупка', path: '/scm/orders' },
      { label: 'Доставки', path: '/scm/deliveries' },
      { label: 'Справки', path: '/scm/reports' }
    ]
  },
  {
    id: 'mes',
    label: 'Производство',
    icon: '⚙️',
    basePath: '/mes',
    items: [
      { label: 'Табло', path: '/mes' },
      { label: 'Рецептури (BOM)', path: '/mes/bom' },
      { label: 'Производствени нар.', path: '/mes/orders' },
      { label: 'Справки', path: '/mes/reports' }
    ]
  },
  {
    id: 'pos',
    label: 'Точка на продажба',
    icon: '🛒',
    basePath: '/pos',
    items: [
      { label: 'Каса', path: '/pos' },
      { label: 'Продажби', path: '/pos/sales' },
      { label: 'Каси', path: '/pos/registers' },
      { label: 'Справки', path: '/pos/reports' }
    ]
  },
  {
    id: 'backup',
    label: 'Архивиране',
    icon: '💾',
    basePath: '/backup',
    items: [
      { label: 'Табло', path: '/backup' },
      { label: 'Политики', path: '/backup/policies' },
      { label: 'История', path: '/backup/jobs' },
      { label: 'Възстановяване', path: '/backup/restore' }
    ]
  }
]

export function Sidebar({ open, onToggle: _onToggle }: { open: boolean; onToggle: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [tenant, setTenant] = useState<{ name: string; logoUrl: string | null } | null>(null)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  useEffect(() => {
    api
      .get('/api/tenant')
      .then((r) => setTenant(r.data.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const active = navGroups.find((g) => location.pathname.startsWith(g.basePath))
    if (active) setExpandedGroup(active.id)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: open ? 240 : 64,
    background: '#0f172a',
    transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    overflow: 'hidden',
    boxShadow: '2px 0 12px rgba(0,0,0,0.15)'
  }

  return (
    <div style={sidebarStyle}>
      <div
        style={{
          padding: open ? '20px 16px 16px' : '20px 12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          minHeight: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'flex-start' : 'center',
          overflow: 'hidden'
        }}
      >
        {open ? (
          tenant?.logoUrl ? (
            <div>
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                style={{
                  maxHeight: 32,
                  maxWidth: 140,
                  objectFit: 'contain',
                  filter: 'brightness(0) invert(1)'
                }}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
                powered by DFlowERP
              </div>
            </div>
          ) : (
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'white',
                  letterSpacing: '-0.3px'
                }}
              >
                {tenant?.name || 'DFlowERP'}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                powered by DFlowERP
              </div>
            </div>
          )
        ) : (
          <div style={{ fontSize: 18 }}>
            {navGroups.find((g) => location.pathname.startsWith(g.basePath))?.icon || '⚡'}
          </div>
        )}
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>
        <NavLink to="/dashboard" end style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: open ? '9px 16px' : '9px 0',
                justifyContent: open ? 'flex-start' : 'center',
                margin: '1px 8px',
                borderRadius: 7,
                background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.65)',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <span style={{ fontSize: 15, flexShrink: 0 }}>🏠</span>
              {open && <span>Табло</span>}
            </div>
          )}
        </NavLink>

        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
          <NavLink to="/users" style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: open ? '9px 16px' : '9px 0',
                  justifyContent: open ? 'flex-start' : 'center',
                  margin: '1px 8px',
                  borderRadius: 7,
                  background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.65)',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <span style={{ fontSize: 15, flexShrink: 0 }}>👥</span>
                {open && <span>Потребители</span>}
              </div>
            )}
          </NavLink>
        )}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 16px' }} />

        {navGroups.map((group) => {
          const isGroupActive = location.pathname.startsWith(group.basePath)
          const isExpanded = expandedGroup === group.id

          return (
            <div key={group.id}>
              <div
                onClick={() => {
                  if (!open) return
                  setExpandedGroup(isExpanded ? null : group.id)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: open ? '9px 16px' : '9px 0',
                  justifyContent: open ? 'space-between' : 'center',
                  margin: '1px 8px',
                  borderRadius: 7,
                  background: isGroupActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: isGroupActive ? '#e0e7ff' : 'rgba(255,255,255,0.65)',
                  fontSize: 13,
                  fontWeight: isGroupActive ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{group.icon}</span>
                  {open && <span style={{ whiteSpace: 'nowrap' }}>{group.label}</span>}
                </div>
                {open && (
                  <span
                    style={{
                      fontSize: 10,
                      opacity: 0.5,
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s',
                      display: 'inline-block'
                    }}
                  >
                    ▼
                  </span>
                )}
              </div>

              {open && isExpanded && (
                <div style={{ overflow: 'hidden' }}>
                  {group.items.map((item) => {
                    const isActive =
                      location.pathname === item.path ||
                      (item.path !== group.basePath && location.pathname.startsWith(item.path))
                    return (
                      <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                        <div
                          style={{
                            padding: '7px 16px 7px 42px',
                            margin: '1px 8px',
                            borderRadius: 6,
                            background: isActive ? 'rgba(99,102,241,0.25)' : 'transparent',
                            color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                            fontSize: 12.5,
                            fontWeight: isActive ? 500 : 400,
                            cursor: 'pointer',
                            transition: 'all 0.12s',
                            whiteSpace: 'nowrap',
                            borderLeft: isActive ? '2px solid #6366f1' : '2px solid transparent'
                          }}
                        >
                          {item.label}
                        </div>
                      </NavLink>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 8px' }}>
        <NavLink to="/settings" style={{ textDecoration: 'none' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: open ? '8px 12px' : '8px 0',
              justifyContent: open ? 'flex-start' : 'center',
              borderRadius: 7,
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 12,
              transition: 'all 0.15s'
            }}
          >
            <span style={{ fontSize: 14 }}>⚙️</span>
            {open && <span>Настройки</span>}
          </div>
        </NavLink>

        {open && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 7,
              marginTop: 2,
              background: 'rgba(255,255,255,0.04)'
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.8)',
                marginBottom: 2
              }}
            >
              {user?.firstName || user?.email?.split('@')[0]}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{user?.email}</div>
          </div>
        )}

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            marginTop: 6,
            padding: open ? '8px 12px' : '8px 0',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 7,
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.45)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: open ? 'flex-start' : 'center',
            gap: 8,
            transition: 'all 0.15s'
          }}
        >
          <span>🚪</span>
          {open && 'Изход'}
        </button>
      </div>
    </div>
  )
}
