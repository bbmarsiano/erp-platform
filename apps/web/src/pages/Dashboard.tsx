import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { api } from '../lib/api'

interface DashboardStats {
  wms: { warehouses: number; stockItems: number; draftReceipts: number; lowStock: number }
  scm: { suppliers: number; pendingOrders: number; openOrders: number }
  mes: { activeBoms: number; inProgressOrders: number; completedThisWeek: number }
  pos: { todaySales: number; todayRevenue: number; registers: number }
  backup: { activePolicies: number; lastBackup: string | null; failedThisWeek: number }
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          wmsWh,
          wmsStock,
          wmsReceipts,
          wmsLow,
          scmSup,
          scmOrders,
          mesBom,
          mesOrders,
          posReg,
          backupPol
        ] = await Promise.allSettled([
          api.get('/api/wms/warehouses'),
          api.get('/api/wms/stock'),
          api.get('/api/wms/receipts'),
          api.get('/api/wms/reports/low-stock'),
          api.get('/api/scm/suppliers'),
          api.get('/api/scm/orders'),
          api.get('/api/mes/bom'),
          api.get('/api/mes/orders'),
          api.get('/api/pos/registers'),
          api.get('/api/backup/policies')
        ])

        const get = (r: PromiseSettledResult<{ data: { data: unknown } }>) =>
          r.status === 'fulfilled' ? (r.value.data.data as unknown[]) : []

        const receipts = get(wmsReceipts) as Array<{ status: string }>
        const orders = get(scmOrders) as Array<{ status: string }>
        const mesOrdersData = get(mesOrders) as Array<{ status: string; actualEnd?: string }>
        const stock = get(wmsStock) as Array<{ quantity: number }>
        const suppliers = get(scmSup) as Array<{ isActive: boolean }>
        const boms = get(mesBom) as Array<{ isActive: boolean }>
        const policies = get(backupPol) as Array<{ isActive: boolean }>

        setStats({
          wms: {
            warehouses: get(wmsWh).length,
            stockItems: stock.filter((s) => s.quantity > 0).length,
            draftReceipts: receipts.filter((r) => r.status === 'DRAFT').length,
            lowStock: get(wmsLow).length
          },
          scm: {
            suppliers: suppliers.filter((s) => s.isActive).length,
            pendingOrders: orders.filter((o) => o.status === 'SENT').length,
            openOrders: orders.filter((o) => !['RECEIVED', 'CANCELLED'].includes(o.status)).length
          },
          mes: {
            activeBoms: boms.filter((b) => b.isActive).length,
            inProgressOrders: mesOrdersData.filter((o) => o.status === 'IN_PROGRESS').length,
            completedThisWeek: mesOrdersData.filter((o) => {
              if (o.status !== 'COMPLETED') return false
              const weekAgo = new Date()
              weekAgo.setDate(weekAgo.getDate() - 7)
              return o.actualEnd ? new Date(o.actualEnd) > weekAgo : false
            }).length
          },
          pos: {
            registers: get(posReg).length,
            todaySales: 0,
            todayRevenue: 0
          },
          backup: {
            activePolicies: policies.filter((p) => p.isActive).length,
            lastBackup: null,
            failedThisWeek: 0
          }
        })
      } finally {
        setLoading(false)
      }
    }
    void fetchStats()
  }, [])

  const modules = [
    {
      id: 'wms',
      name: 'Складово стопанство',
      path: '/wms',
      icon: '🏭',
      color: '#dbeafe',
      borderColor: '#93c5fd',
      stats: stats
        ? [
            { label: 'Складове', value: stats.wms.warehouses },
            { label: 'Артикули в наличност', value: stats.wms.stockItems },
            { label: 'Чернови приходни', value: stats.wms.draftReceipts },
            { label: 'Под минимум', value: stats.wms.lowStock, alert: stats.wms.lowStock > 0 }
          ]
        : []
    },
    {
      id: 'scm',
      name: 'Верига на доставките',
      path: '/scm',
      icon: '🚚',
      color: '#dcfce7',
      borderColor: '#86efac',
      stats: stats
        ? [
            { label: 'Доставчици', value: stats.scm.suppliers },
            {
              label: 'Поръчки в изчакване',
              value: stats.scm.pendingOrders,
              alert: stats.scm.pendingOrders > 0
            },
            { label: 'Незатворени поръчки', value: stats.scm.openOrders }
          ]
        : []
    },
    {
      id: 'mes',
      name: 'Производство',
      path: '/mes',
      icon: '⚙️',
      color: '#fef9c3',
      borderColor: '#fde047',
      stats: stats
        ? [
            { label: 'Активни рецептури', value: stats.mes.activeBoms },
            { label: 'В изпълнение', value: stats.mes.inProgressOrders },
            { label: 'Завършени тази седмица', value: stats.mes.completedThisWeek }
          ]
        : []
    },
    {
      id: 'pos',
      name: 'Точка на продажба',
      path: '/pos',
      icon: '🛒',
      color: '#fce7f3',
      borderColor: '#f9a8d4',
      stats: stats
        ? [
            { label: 'Каси', value: stats.pos.registers },
            { label: 'Продажби днес', value: stats.pos.todaySales },
            { label: 'Приход днес', value: `${stats.pos.todayRevenue.toFixed(2)} лв.` }
          ]
        : []
    },
    {
      id: 'backup',
      name: 'Архивиране',
      path: '/backup',
      icon: '💾',
      color: '#f3f4f6',
      borderColor: '#d1d5db',
      stats: stats
        ? [
            { label: 'Активни политики', value: stats.backup.activePolicies },
            { label: 'Последно архивиране', value: stats.backup.lastBackup ?? 'Няма' },
            {
              label: 'Грешки тази седмица',
              value: stats.backup.failedThisWeek,
              alert: stats.backup.failedThisWeek > 0
            }
          ]
        : []
    }
  ]

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Добро утро'
    if (h < 18) return 'Добърден'
    return 'Добър вечер'
  }

  return (
    <div style={{ padding: '32px', maxWidth: 1200 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: '#111' }}>
          {greeting()}, {user?.firstName ?? user?.email?.split('@')[0]} 👋
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
          {new Date().toLocaleDateString('bg-BG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 14 }}>
          Зареждане на данните...
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16
          }}
        >
          {modules.map((mod) => (
            <div
              key={mod.id}
              onClick={() => navigate(mod.path)}
              style={{
                background: 'white',
                border: `1px solid ${mod.borderColor}`,
                borderRadius: 12,
                padding: 20,
                cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: mod.borderColor
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 24 }}>{mod.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{mod.name}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>Виж детайли →</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {mod.stats.map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      background: stat.alert ? '#fef2f2' : mod.color,
                      borderRadius: 8,
                      padding: '8px 10px'
                    }}
                  >
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: stat.alert ? '#dc2626' : '#111'
                      }}
                    >
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
