import { Component, ErrorInfo, ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Settings from './pages/Settings'
import Help from './pages/Help'
import Users from './pages/users/Users'
import BackupRouter from './modules/backup/BackupRouter'
import PosRouter from './modules/pos/PosRouter'
import NotFound from './pages/NotFound'
import { useAuthStore } from './store/auth.store'
import AppShell from './components/layout/AppShell'
import MesRouter from './modules/mes/MesRouter'
import WmsRouter from './modules/wms/WmsRouter'
import ScmRouter from './modules/scm/ScmRouter'
import FinanceRouter from './modules/finance/FinanceRouter'
import FinancialPeriods from './modules/finance/pages/FinancialPeriods'
import { SessionWarning } from './components/SessionWarning'
import { RoleProtectedRoute } from './components/RoleProtectedRoute'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, color: 'red' }}>
          <h2>Грешка при зареждане</h2>
          <pre>{String(this.state.error)}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function ProtectedModule({
  moduleId,
  children
}: {
  moduleId: string
  children: React.ReactNode
}) {
  return (
    <PrivateRoute>
      <RoleProtectedRoute moduleId={moduleId}>
        <AppShell>{children}</AppShell>
      </RoleProtectedRoute>
    </PrivateRoute>
  )
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <ErrorBoundary>
      <BrowserRouter>
        {isAuthenticated && <SessionWarning />}
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedModule moduleId="dashboard">
              <Dashboard />
            </ProtectedModule>
          }
        />
        <Route
          path="/wms/*"
          element={
            <ProtectedModule moduleId="wms">
              <WmsRouter />
            </ProtectedModule>
          }
        />
        <Route
          path="/scm/*"
          element={
            <ProtectedModule moduleId="scm">
              <ScmRouter />
            </ProtectedModule>
          }
        />
        <Route
          path="/mes/*"
          element={
            <ProtectedModule moduleId="mes">
              <MesRouter />
            </ProtectedModule>
          }
        />
        <Route
          path="/pos/*"
          element={
            <ProtectedModule moduleId="pos">
              <PosRouter />
            </ProtectedModule>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedModule moduleId="users">
              <Users />
            </ProtectedModule>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedModule moduleId="settings">
              <Settings />
            </ProtectedModule>
          }
        />
        <Route
          path="/help"
          element={
            <PrivateRoute>
              <AppShell>
                <Help />
              </AppShell>
            </PrivateRoute>
          }
        />
        <Route
          path="/finance/periods"
          element={
            <ProtectedModule moduleId="finance-periods">
              <FinancialPeriods />
            </ProtectedModule>
          }
        />
        <Route
          path="/finance/*"
          element={
            <ProtectedModule moduleId="finance">
              <FinanceRouter />
            </ProtectedModule>
          }
        />
        <Route
          path="/backup/*"
          element={
            <ProtectedModule moduleId="backup">
              <BackupRouter />
            </ProtectedModule>
          }
        />
        <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
