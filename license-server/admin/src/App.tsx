import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import Dashboard from './pages/Dashboard'
import Tenants from './pages/Tenants'
import Licenses from './pages/Licenses'
import GenerateLicense from './pages/GenerateLicense'
import Pricing from './pages/Pricing'

function AppContent() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tenants" element={<Tenants />} />
        <Route path="/licenses" element={<Licenses />} />
        <Route path="/generate" element={<GenerateLicense />} />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return <AppContent />
}
