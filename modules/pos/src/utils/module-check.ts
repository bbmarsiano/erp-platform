export function isFinanceModuleEnabled(enabledModules: string[] | null | undefined): boolean {
  if (!enabledModules || enabledModules.length === 0) return true
  return enabledModules.includes('finance')
}
