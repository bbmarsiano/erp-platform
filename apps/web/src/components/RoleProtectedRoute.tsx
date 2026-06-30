import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { canAccessModule } from '../lib/menuPermissions'
import { isModuleEnabledForTenant } from '../lib/tenantModules'
import { useAuthStore } from '../store/auth.store'
import { useToastStore } from '../store/toast.store'

export function RoleProtectedRoute({
  moduleId,
  children
}: {
  moduleId: string
  children: React.ReactNode
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const role = useAuthStore((s) => s.user?.role)
  const enabledModules = useAuthStore((s) => s.enabledModules)
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.show)
  const roleAllowed = canAccessModule(role, moduleId)
  const tenantAllowed = isModuleEnabledForTenant({ enabledModules }, moduleId)
  const allowed = roleAllowed && tenantAllowed

  useEffect(() => {
    if (isAuthenticated && !allowed) {
      showToast(
        !tenantAllowed ? 'Модулът не е активиран за тази фирма' : 'Нямате достъп до този модул'
      )
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, allowed, tenantAllowed, navigate, showToast])

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!allowed) return null
  return <>{children}</>
}
