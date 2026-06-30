export function isModuleEnabledForTenant(
  tenant: { enabledModules?: string[] } | null | undefined,
  moduleId: string
): boolean {
  const modules = tenant?.enabledModules
  if (!modules || modules.length === 0) return true
  return modules.includes(moduleId)
}
