import type { ModuleManifest } from '@dflow/core'

export const scmManifest: ModuleManifest = {
  id: 'scm',
  name: 'Верига на доставките',
  version: '1.0.0',
  description: 'Управление на доставчици, поръчки за покупка и доставки',
  requiredFeature: 'module:scm',
  dependencies: ['wms'],
  apiPrefix: '/api/scm',
  icon: 'Truck',
  navItems: [
    { label: 'Табло', path: '/scm', icon: 'LayoutDashboard', requiredRole: ['ADMIN', 'MANAGER', 'OPERATOR'] },
    { label: 'Доставчици', path: '/scm/suppliers', icon: 'Building2', requiredRole: ['ADMIN', 'MANAGER'] },
    { label: 'Поръчки покупка', path: '/scm/orders', icon: 'ShoppingCart', requiredRole: ['ADMIN', 'MANAGER', 'OPERATOR'] },
    { label: 'Доставки', path: '/scm/deliveries', icon: 'Truck', requiredRole: ['ADMIN', 'MANAGER', 'OPERATOR'] },
    { label: 'Справки', path: '/scm/reports', icon: 'BarChart3', requiredRole: ['ADMIN', 'MANAGER'] }
  ]
}

