import { prisma } from '@dflow/db'
import type { MovementFilters } from '../types/wms.types'

export const listMovements = async (tenantId: string, filters: MovementFilters) =>
  prisma.stockMovement.findMany({
    where: {
      tenantId,
      ...(filters.productId ? { productId: filters.productId } : {}),
      ...(filters.type ? { movementType: filters.type } : {}),
      ...(filters.dateFrom || filters.dateTo
        ? {
            createdAt: {
              ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
              ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {})
            }
          }
        : {})
    },
    include: {
      product: true
    },
    orderBy: { createdAt: 'desc' }
  })
