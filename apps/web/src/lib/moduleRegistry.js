class ModuleRegistry {
    registry = new Map();
    registerModule(manifest) {
        this.registry.set(manifest.id, manifest);
    }
    getModules() {
        return Array.from(this.registry.values());
    }
    getNavItems() {
        return this.getModules().map((module) => ({
            moduleId: module.id,
            moduleName: module.name,
            items: module.navItems
        }));
    }
}
export const moduleRegistry = new ModuleRegistry();
export const registerModule = (manifest) => {
    moduleRegistry.registerModule(manifest);
};
