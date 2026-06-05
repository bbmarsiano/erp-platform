import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Settings from './pages/Settings'
import Users from './pages/users/Users'
import BackupRouter from './modules/backup/BackupRouter'
import PosRouter from './modules/pos/PosRouter'
import NotFound from './pages/NotFound'
import { useAuthStore } from './store/auth.store'
import AppShell from './components/layout/AppShell'
import MesRouter from './modules/mes/MesRouter'
import WmsRouter from './modules/wms/WmsRouter'
import ScmRouter from './modules/scm/ScmRouter'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AppShell>
                <Dashboard />
              </AppShell>
            </PrivateRoute>
          }
        />
        <Route
          path="/wms/*"
          element={
            <PrivateRoute>
              <AppShell>
                <WmsRouter />
              </AppShell>
            </PrivateRoute>
          }
        />
        <Route
          path="/scm/*"
          element={
            <PrivateRoute>
              <AppShell>
                <ScmRouter />
              </AppShell>
            </PrivateRoute>
          }
        />
        <Route
          path="/mes/*"
          element={
            <PrivateRoute>
              <AppShell>
                <MesRouter />
              </AppShell>
            </PrivateRoute>
          }
        />
        <Route
          path="/pos/*"
          element={
            <PrivateRoute>
              <AppShell>
                <PosRouter />
              </AppShell>
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <AppShell>
                <Users />
              </AppShell>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <AppShell>
                <Settings />
              </AppShell>
            </PrivateRoute>
          }
        />
        <Route
          path="/backup/*"
          element={
            <PrivateRoute>
              <AppShell>
                <BackupRouter />
              </AppShell>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
