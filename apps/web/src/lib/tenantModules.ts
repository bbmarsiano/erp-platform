const TENANT_TOGGLEABLE_MODULES = new Set(['wms', 'scm', 'mes', 'pos', 'finance', 'backup'])

export function isModuleEnabledForTenant(
  tenant: { enabledModules?: string[] } | null | undefined,
  moduleId: string
): boolean {
  if (!TENANT_TOGGLEABLE_MODULES.has(moduleId)) return true
  const modules = tenant?.enabledModules
  if (!modules || modules.length === 0) return true
  return modules.includes(moduleId)
}

/** Finance is enabled only when explicitly listed in tenant.enabledModules. */
export function isFinanceModuleEnabledForTenant(
  tenant: { enabledModules?: string[] } | null | undefined
): boolean {
  return Boolean(tenant?.enabledModules?.includes('finance'))
}
