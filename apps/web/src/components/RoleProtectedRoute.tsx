import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { canAccessModule } from '../lib/menuPermissions'
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
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.show)
  const allowed = canAccessModule(role, moduleId)

  useEffect(() => {
    if (isAuthenticated && !allowed) {
      showToast('Нямате достъп до този модул')
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, allowed, navigate, showToast])

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!allowed) return null
  return <>{children}</>
}
