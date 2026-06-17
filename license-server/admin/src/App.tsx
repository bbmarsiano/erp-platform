import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Tenants from './pages/Tenants'
import Licenses from './pages/Licenses'
import GenerateLicense from './pages/GenerateLicense'
import Pricing from './pages/Pricing'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tenants', label: 'Tenants' },
  { to: '/licenses', label: 'Licenses' },
  { to: '/generate', label: 'GenerateLicense' },
  { to: '/pricing', label: '💰 Ценова конфигурация' }
]

export default function App() {
  const location = useLocation()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, Arial, sans-serif' }}>
      <aside style={{ width: 240, background: '#111', color: '#fff', padding: 20 }}>
        <h2 style={{ margin: '0 0 20px' }}>License Admin</h2>
        <nav style={{ display: 'grid', gap: 8 }}>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                color: '#fff',
                textDecoration: 'none',
                padding: '10px 12px',
                borderRadius: 8,
                background: location.pathname === item.to ? '#333' : 'transparent'
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main style={{ flex: 1, background: '#fff', padding: 24 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tenants" element={<Tenants />} />
          <Route path="/licenses" element={<Licenses />} />
          <Route path="/generate" element={<GenerateLicense />} />
          <Route path="/pricing" element={<Pricing />} />
        </Routes>
      </main>
    </div>
  )
}

