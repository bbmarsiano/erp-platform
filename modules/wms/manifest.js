export const wmsManifest = {
    id: 'wms',
    name: 'Складово стопанство',
    version: '1.0.0',
    description: 'Управление на складови наличности, приемане и изпращане на стоки',
    requiredFeature: 'module:wms',
    dependencies: [],
    apiPrefix: '/api/wms',
    icon: 'Warehouse',
    navItems: [
        { label: 'Табло', path: '/wms', icon: 'LayoutDashboard', requiredRole: ['ADMIN', 'MANAGER', 'OPERATOR'] },
        { label: 'Складове', path: '/wms/warehouses', icon: 'Warehouse', requiredRole: ['ADMIN', 'MANAGER'] },
        { label: 'Наличности', path: '/wms/stock', icon: 'Package', requiredRole: ['ADMIN', 'MANAGER', 'OPERATOR'] },
        { label: 'Приемане', path: '/wms/receipts', icon: 'PackageCheck', requiredRole: ['ADMIN', 'MANAGER', 'OPERATOR'] },
        { label: 'Изпращане', path: '/wms/issues', icon: 'PackageMinus', requiredRole: ['ADMIN', 'MANAGER', 'OPERATOR'] },
        { label: 'Движения', path: '/wms/movements', icon: 'ArrowLeftRight', requiredRole: ['ADMIN', 'MANAGER'] },
        { label: 'Справки', path: '/wms/reports', icon: 'BarChart3', requiredRole: ['ADMIN', 'MANAGER'] }
    ]
};
