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

const moduleColors: Record<string, { gradient: string; accent: string; text: string }> = {
  wms: { gradient: 'linear-gradient(135deg,#667eea,#764ba2)', accent: '#667eea', text: '#4f46e5' },
  scm: { gradient: 'linear-gradient(135deg,#11998e,#38ef7d)', accent: '#11998e', text: '#059669' },
  mes: { gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', accent: '#f5576c', text: '#dc2626' },
  pos: { gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)', accent: '#4facfe', text: '#0284c7' },
  backup: { gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)', accent: '#38f9d7', text: '#0d9488' }
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse-dot {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      .module-card {
        animation: fadeInUp 0.4s ease both;
        cursor: pointer;
        background: white;
        border-radius: 14px;
        padding: 22px;
        border: 1px solid #e5e7eb;
        transition: transform 0.18s cubic-bezier(0.4,0,0.2,1),
                    box-shadow 0.18s cubic-bezier(0.4,0,0.2,1);
        position: relative;
        overflow: hidden;
      }
      .module-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 32px rgba(0,0,0,0.08);
      }
      .stat-chip {
        border-radius: 10px;
        padding: 10px 12px;
        transition: transform 0.15s;
      }
      .stat-chip:hover { transform: scale(1.02); }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

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
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                margin: '0 0 4px',
                color: '#0f172a',
                letterSpacing: '-0.5px'
              }}
            >
              {greeting()}, {user?.firstName ?? user?.email?.split('@')[0]} 👋
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
              {new Date().toLocaleDateString('bg-BG', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 20,
              fontSize: 12,
              color: '#6b7280',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#22c55e',
                animation: 'pulse-dot 2s ease infinite'
              }}
            />
            Онлайн
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 14 }}>
          Зареждане на данните...
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 20
          }}
        >
          {modules.map((mod, idx) => {
            const colors = moduleColors[mod.id]
            return (
              <div
                key={mod.id}
                className="module-card"
                style={{ animationDelay: `${idx * 0.07}s` }}
                onClick={() => navigate(mod.path)}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: colors.gradient,
                    borderRadius: '14px 14px 0 0'
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: colors.gradient,
                    opacity: 0.06
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 18
                  }}
                >
                  <div>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        marginBottom: 10,
                        background: colors.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        boxShadow: `0 4px 12px ${colors.accent}40`
                      }}
                    >
                      {mod.icon}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{mod.name}</div>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: colors.text,
                      background: `${colors.accent}15`,
                      padding: '3px 10px',
                      borderRadius: 20
                    }}
                  >
                    Виж →
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {mod.stats.map((stat) => {
                    const hasAlert = 'alert' in stat && stat.alert
                    return (
                      <div
                        key={stat.label}
                        className="stat-chip"
                        style={{
                          background: hasAlert ? '#fef2f2' : '#f8faff',
                          border: hasAlert ? '1px solid #fecaca' : '1px solid #e8edf5'
                        }}
                      >
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 800,
                            letterSpacing: '-0.5px',
                            color: hasAlert ? '#dc2626' : '#111',
                            lineHeight: 1.1
                          }}
                        >
                          {stat.value}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: hasAlert ? '#ef4444' : '#6b7280',
                            marginTop: 3,
                            fontWeight: 500
                          }}
                        >
                          {stat.label}
                          {hasAlert && ' ⚠️'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
