import type { ModuleManifest } from '@dflow/core'

export const financeManifest: ModuleManifest = {
  id: 'finance',
  name: 'Финанси',
  version: '1.0.0',
  description: 'Управление на клиенти и сметкоплан',
  requiredFeature: 'module:finance',
  dependencies: [],
  apiPrefix: '/api/finance',
  icon: 'Landmark',
  navItems: [
    { label: 'Табло', path: '/finance', icon: 'LayoutDashboard', requiredRole: ['SUPER_ADMIN', 'MANAGER'] },
    { label: 'Клиенти', path: '/finance/customers', icon: 'Users', requiredRole: ['SUPER_ADMIN', 'MANAGER'] },
    {
      label: 'Сметкоплан',
      path: '/finance/chart-of-accounts',
      icon: 'ListTree',
      requiredRole: ['SUPER_ADMIN', 'MANAGER']
    }
  ]
}
