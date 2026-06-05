export const backupManifest = {
    id: 'backup',
    name: 'Архивиране',
    version: '1.0.0',
    description: 'Управление на архивиране, политики и възстановяване',
    requiredFeature: 'module:backup',
    dependencies: [],
    apiPrefix: '/api/backup',
    icon: 'HardDrive',
    navItems: [
        { label: 'Табло', path: '/backup', icon: 'LayoutDashboard', requiredRole: ['ADMIN'] },
        { label: 'Политики', path: '/backup/policies', icon: 'Shield', requiredRole: ['ADMIN'] },
        { label: 'История', path: '/backup/jobs', icon: 'History', requiredRole: ['ADMIN'] },
        { label: 'Възстановяване', path: '/backup/restore', icon: 'RotateCcw', requiredRole: ['ADMIN'] }
    ]
};
