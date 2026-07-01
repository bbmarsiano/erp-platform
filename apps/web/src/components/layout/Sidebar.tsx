import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Warehouse,
  Truck,
  Factory,
  ShoppingCart,
  HardDrive,
  Landmark,
  Settings,
  LogOut,
  ChevronDown,
  Package,
  BarChart3,
  ClipboardList,
  Building2,
  ListTree,
  Monitor,
  CreditCard,
  Shield,
  History,
  RotateCcw,
  Wallet,
  Calendar,
  X
} from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import { api } from '../../lib/api'
import { canAccessModule } from '../../lib/menuPermissions'
import { isModuleEnabledForTenant } from '../../lib/tenantModules'

interface NavItem {
  label: string
  path: string
  permissionId?: string
}
interface NavGroup {
  id: string
  label: string
  items: NavItem[]
  basePath: string
}

const navGroups: NavGroup[] = [
  {
    id: 'wms',
    label: 'Складово стопанство',
    basePath: '/wms',
    items: [
      { label: 'Табло', path: '/wms' },
      { label: 'Складове', path: '/wms/warehouses' },
      { label: 'Продукти', path: '/wms/products' },
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
    basePath: '/pos',
    items: [
      { label: 'Каса', path: '/pos' },
      { label: 'Продажби', path: '/pos/sales' },
      { label: 'Каси', path: '/pos/registers' },
      { label: 'Справки', path: '/pos/reports' }
    ]
  },
  {
    id: 'finance',
    label: 'Финанси',
    basePath: '/finance',
    items: [
      { label: 'Табло', path: '/finance' },
      { label: 'Клиенти', path: '/finance/customers' },
      { label: 'Сметкоплан', path: '/finance/chart-of-accounts' },
      { label: 'Фактури', path: '/finance/invoices' },
      { label: 'Вземания', path: '/finance/receivables' },
      { label: 'Задължения', path: '/finance/payables' },
      { label: 'Главна книга', path: '/finance/journal-entries' },
      { label: 'Банкови сметки', path: '/finance/bank-accounts' },
      { label: 'Банкови транзакции', path: '/finance/bank-transactions' },
      { label: 'Справки', path: '/finance/reports' },
      { label: 'Периоди', path: '/finance/periods', permissionId: 'finance-periods' }
    ]
  },
  {
    id: 'backup',
    label: 'Архивиране',
    basePath: '/backup',
    items: [
      { label: 'Табло', path: '/backup' },
      { label: 'Политики', path: '/backup/policies' },
      { label: 'История', path: '/backup/jobs' },
      { label: 'Възстановяване', path: '/backup/restore' }
    ]
  }
]

const groupIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  wms: { icon: <Warehouse size={17} />, color: '#818cf8' },
  scm: { icon: <Truck size={17} />, color: '#34d399' },
  mes: { icon: <Factory size={17} />, color: '#f472b6' },
  pos: { icon: <ShoppingCart size={17} />, color: '#38bdf8' },
  finance: { icon: <Landmark size={17} />, color: '#fbbf24' },
  backup: { icon: <HardDrive size={17} />, color: '#4ade80' }
}

const itemIcons: Record<string, React.ReactNode> = {
  '/wms': <LayoutDashboard size={13} />,
  '/wms/warehouses': <Warehouse size={13} />,
  '/wms/products': <Package size={13} />,
  '/wms/stock': <Package size={13} />,
  '/wms/receipts': <ClipboardList size={13} />,
  '/wms/issues': <ClipboardList size={13} />,
  '/wms/movements': <BarChart3 size={13} />,
  '/wms/reports': <BarChart3 size={13} />,
  '/scm': <LayoutDashboard size={13} />,
  '/scm/suppliers': <Building2 size={13} />,
  '/scm/orders': <ClipboardList size={13} />,
  '/scm/deliveries': <Truck size={13} />,
  '/scm/reports': <BarChart3 size={13} />,
  '/mes': <LayoutDashboard size={13} />,
  '/mes/bom': <ListTree size={13} />,
  '/mes/orders': <ClipboardList size={13} />,
  '/mes/reports': <BarChart3 size={13} />,
  '/pos': <Monitor size={13} />,
  '/pos/sales': <ClipboardList size={13} />,
  '/pos/registers': <CreditCard size={13} />,
  '/pos/reports': <BarChart3 size={13} />,
  '/finance': <LayoutDashboard size={13} />,
  '/finance/customers': <Users size={13} />,
  '/finance/chart-of-accounts': <ListTree size={13} />,
  '/finance/invoices': <ClipboardList size={13} />,
  '/finance/receivables': <CreditCard size={13} />,
  '/finance/payables': <CreditCard size={13} />,
  '/finance/journal-entries': <BarChart3 size={13} />,
  '/finance/bank-accounts': <Wallet size={13} />,
  '/finance/bank-transactions': <CreditCard size={13} />,
  '/finance/reports': <BarChart3 size={13} />,
  '/finance/periods': <Calendar size={13} />,
  '/backup': <LayoutDashboard size={13} />,
  '/backup/policies': <Shield size={13} />,
  '/backup/jobs': <History size={13} />,
  '/backup/restore': <RotateCcw size={13} />
}

export function Sidebar({
  open,
  onToggle,
  isMobile
}: {
  open: boolean
  onToggle: () => void
  isMobile: boolean
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const licensedFeatures = useAuthStore((s) => s.licensedFeatures)
  const enabledModules = useAuthStore((s) => s.enabledModules)
  const logout = useAuthStore((s) => s.logout)
  const [tenant, setTenant] = useState<{ name: string; logoUrl: string | null } | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const isModuleLicensed = useMemo(
    () =>
      (moduleId: string): boolean => {
        const featureMap: Record<string, string> = {
          wms: 'module:wms',
          scm: 'module:scm',
          mes: 'module:mes',
          pos: 'module:pos',
          finance: 'module:finance',
          backup: 'module:backup'
        }
        const featureKey = featureMap[moduleId]
        if (!featureKey) return true
        if (!licensedFeatures || licensedFeatures.length === 0) return true
        return licensedFeatures.includes(featureKey)
      },
    [licensedFeatures]
  )

  const visibleGroups = useMemo(
    () =>
      navGroups.filter(
        (group) =>
          isModuleLicensed(group.id) &&
          canAccessModule(user?.role, group.id) &&
          isModuleEnabledForTenant({ enabledModules }, group.id)
      ),
    [isModuleLicensed, user?.role, enabledModules]
  )

  const canSeeDashboard = canAccessModule(user?.role, 'dashboard')
  const canSeeUsers = canAccessModule(user?.role, 'users')
  const canSeeSettings = canAccessModule(user?.role, 'settings')

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      if (prev.has(groupId)) {
        const next = new Set(prev)
        next.delete(groupId)
        return next
      }
      return new Set([groupId])
    })
  }

  useEffect(() => {
    api
      .get('/api/tenant')
      .then((r) => setTenant(r.data.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    visibleGroups.forEach((group) => {
      if (location.pathname.startsWith(`/${group.id}`)) {
        setExpandedGroups(new Set([group.id]))
      }
    })
  }, [location.pathname, visibleGroups])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 240,
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        zIndex: isMobile ? 100 : 100,
        overflow: 'hidden',
        boxShadow: '2px 0 12px rgba(0,0,0,0.15)'
      }}
    >
      {isMobile && (
        <button
          onClick={onToggle}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: 6,
            padding: 6,
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}
        >
          <X size={16} />
        </button>
      )}

      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {tenant?.logoUrl ? (
          <div>
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              style={{ maxHeight: 36, maxWidth: 160, objectFit: 'contain', display: 'block' }}
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
              powered by DFlowERP
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 16, fontWeight: 700, color: 'white', letterSpacing: '-0.3px' }}>
            {tenant?.name || 'DFlowERP'}
          </div>
        )}
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>
        {canSeeDashboard ? (
          <NavLink to="/dashboard" end style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 16px',
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
                <LayoutDashboard size={17} color="#94a3b8" />
                {open && <span>Табло</span>}
              </div>
            )}
          </NavLink>
        ) : null}

        {canSeeUsers ? (
          <NavLink to="/users" style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 16px',
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
                <Users size={17} color="#94a3b8" />
                {open && <span>Потребители</span>}
              </div>
            )}
          </NavLink>
        ) : null}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 16px' }} />

        {visibleGroups.map((group) => {
          const isGroupActive = location.pathname.startsWith(group.basePath)
          const isExpanded = expandedGroups.has(group.id)
          const gIcon = groupIcons[group.id]

          return (
            <div key={group.id}>
              <div
                onClick={() => toggleGroup(group.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 16px',
                  justifyContent: 'space-between',
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
                  <span style={{ color: gIcon.color, display: 'flex', flexShrink: 0 }}>
                    {gIcon.icon}
                  </span>
                  {open && <span style={{ whiteSpace: 'nowrap' }}>{group.label}</span>}
                </div>
                {open && (
                  <ChevronDown
                    size={12}
                    style={{
                      opacity: 0.5,
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s',
                      flexShrink: 0
                    }}
                  />
                )}
              </div>

              {open && isExpanded && (
                <div style={{ overflow: 'hidden' }}>
                  {group.items
                    .filter((item) => !item.permissionId || canAccessModule(user?.role, item.permissionId))
                    .map((item) => {
                    const isActive =
                      location.pathname === item.path ||
                      (item.path !== group.basePath && location.pathname.startsWith(item.path))
                    return (
                      <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
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
                          <span style={{ opacity: 0.6, display: 'flex', flexShrink: 0 }}>
                            {itemIcons[item.path]}
                          </span>
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
        {canSeeSettings ? (
          <NavLink to="/settings" style={{ textDecoration: 'none' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 7,
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)',
                fontSize: 12,
                transition: 'all 0.15s'
              }}
            >
              <Settings size={15} color="#6b7280" />
              {open && <span>Настройки</span>}
            </div>
          </NavLink>
        ) : null}

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
            padding: '8px 12px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 7,
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.45)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 8,
            transition: 'all 0.15s'
          }}
        >
          <LogOut size={14} color="#6b7280" />
          {open && 'Изход'}
        </button>
      </div>
    </div>
  )
}
