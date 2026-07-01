export type AppUserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'READONLY'

export const menuPermissions: Record<string, AppUserRole[]> = {
  dashboard: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR'],
  users: ['SUPER_ADMIN', 'ADMIN'],
  wms: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR'],
  scm: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  mes: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR'],
  pos: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR'],
  finance: ['SUPER_ADMIN', 'MANAGER'],
  'finance-periods': ['SUPER_ADMIN', 'MANAGER'],
  backup: ['SUPER_ADMIN', 'ADMIN'],
  settings: ['SUPER_ADMIN', 'ADMIN']
}

export function canAccessModule(role: string | undefined, moduleId: string): boolean {
  if (!role) return false
  const allowed = menuPermissions[moduleId]
  if (!allowed) return false
  return allowed.includes(role as AppUserRole)
}
