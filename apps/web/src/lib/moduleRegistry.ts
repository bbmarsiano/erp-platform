import type { ModuleManifest, NavItem } from '@dflow/core'

type GroupedNavItems = {
  moduleId: string
  moduleName: string
  items: NavItem[]
}

class ModuleRegistry {
  private readonly registry = new Map<string, ModuleManifest>()

  registerModule(manifest: ModuleManifest): void {
    this.registry.set(manifest.id, manifest)
  }

  getModules(): ModuleManifest[] {
    return Array.from(this.registry.values())
  }

  getNavItems(): GroupedNavItems[] {
    return this.getModules().map((module) => ({
      moduleId: module.id,
      moduleName: module.name,
      items: module.navItems
    }))
  }
}

export const moduleRegistry = new ModuleRegistry()

export const registerModule = (manifest: ModuleManifest) => {
  moduleRegistry.registerModule(manifest)
}
