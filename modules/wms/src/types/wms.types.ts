export type TenantScopedRequest = {
  user: {
    tenantId: string
    id: string
    email: string
    role: string
  }
}

export type StockFilters = {
  warehouseId?: string
  productId?: string
  lowStock?: boolean
}

export type MovementFilters = {
  productId?: string
  type?: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT'
  dateFrom?: string
  dateTo?: string
}
