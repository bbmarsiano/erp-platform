export const posManifest = {
    id: 'pos',
    name: 'Точка на продажба',
    version: '1.0.0',
    description: 'POS система за управление на продажби на дребно',
    requiredFeature: 'module:pos',
    dependencies: ['wms'],
    apiPrefix: '/api/pos',
    icon: 'ShoppingCart',
    navItems: [
        { label: 'Каса', path: '/pos', icon: 'Monitor', requiredRole: ['ADMIN', 'MANAGER', 'OPERATOR'] },
        { label: 'Продажби', path: '/pos/sales', icon: 'Receipt', requiredRole: ['ADMIN', 'MANAGER', 'OPERATOR'] },
        { label: 'Каси', path: '/pos/registers', icon: 'CreditCard', requiredRole: ['ADMIN', 'MANAGER'] },
        { label: 'Справки', path: '/pos/reports', icon: 'BarChart3', requiredRole: ['ADMIN', 'MANAGER'] }
    ]
};
