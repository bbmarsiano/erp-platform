import type { ModuleManifest } from '@dflow/core'

export const mesManifest: ModuleManifest = {
  id: 'mes',
  name: 'Производство',
  version: '1.0.0',
  description: 'Управление на производствени поръчки и рецептури',
  requiredFeature: 'module:mes',
  dependencies: ['wms'],
  apiPrefix: '/api/mes',
  icon: 'Factory',
  navItems: [
    { label: 'Табло', path: '/mes', icon: 'LayoutDashboard', requiredRole: ['ADMIN', 'MANAGER', 'OPERATOR'] },
    { label: 'Рецептури (BOM)', path: '/mes/bom', icon: 'ListTree', requiredRole: ['ADMIN', 'MANAGER'] },
    { label: 'Производствени нар.', path: '/mes/orders', icon: 'ClipboardList', requiredRole: ['ADMIN', 'MANAGER', 'OPERATOR'] },
    { label: 'Справки', path: '/mes/reports', icon: 'BarChart3', requiredRole: ['ADMIN', 'MANAGER'] }
  ]
}

