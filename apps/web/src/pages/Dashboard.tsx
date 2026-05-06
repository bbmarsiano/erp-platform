import { useAuthStore } from '../store/auth.store'

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)

  const modules = [
    { id: 'wms', name: 'Warehouse Management', status: 'coming_soon', icon: '🏭' },
    { id: 'scm', name: 'Supply Chain', status: 'coming_soon', icon: '🚚' },
    { id: 'mes', name: 'Manufacturing', status: 'coming_soon', icon: '⚙️' },
    { id: 'pos', name: 'Point of Sale', status: 'coming_soon', icon: '🛒' },
    { id: 'backup', name: 'Backup & Archive', status: 'coming_soon', icon: '💾' }
  ]

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 4px' }}>Welcome, {user?.firstName ?? user?.email}</h1>
      <p style={{ color: '#666', margin: '0 0 32px', fontSize: '14px' }}>
        {user?.role} · Tenant ID: {user?.tenantId}
      </p>

      <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>Modules</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {modules.map((mod) => (
          <div
            key={mod.id}
            style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '28px' }}>{mod.icon}</span>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{mod.name}</span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '20px',
                background: '#f3f4f6',
                color: '#6b7280',
                alignSelf: 'flex-start'
              }}
            >
              Coming soon
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
