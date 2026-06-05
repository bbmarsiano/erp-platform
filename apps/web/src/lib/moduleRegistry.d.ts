import type { ModuleManifest, NavItem } from '@dflow/core';
type GroupedNavItems = {
    moduleId: string;
    moduleName: string;
    items: NavItem[];
};
declare class ModuleRegistry {
    private readonly registry;
    registerModule(manifest: ModuleManifest): void;
    getModules(): ModuleManifest[];
    getNavItems(): GroupedNavItems[];
}
export declare const moduleRegistry: ModuleRegistry;
export declare const registerModule: (manifest: ModuleManifest) => void;
export {};
