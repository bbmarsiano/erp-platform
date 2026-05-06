export interface ModuleManifest {
  id: string
  name: string
  version: string
  description: string
  requiredFeature: string
  dependencies: string[]
  apiPrefix: string
  icon: string
  navItems: NavItem[]
}

export interface NavItem {
  label: string
  path: string
  icon: string
  requiredRole: string[]
}
