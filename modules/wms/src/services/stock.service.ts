import { prisma } from '@dflow/db'
import type { Prisma } from '@prisma/client'
import type { StockFilters } from '../types/wms.types'

export const listStock = async (tenantId: string, filters: StockFilters) => {
  const where: Prisma.StockItemWhereInput = {
    tenantId,
    ...(filters.productId ? { productId: filters.productId } : {}),
    ...(filters.warehouseId ? { location: { warehouseId: filters.warehouseId } } : {})
  }

  const items = await prisma.stockItem.findMany({
    where,
    include: {
      product: true,
      location: {
        include: { warehouse: true }
      }
    },
    orderBy: [{ product: { code: 'asc' } }, { location: { code: 'asc' } }]
  })

  if (filters.lowStock) {
    return items.filter((item) => item.quantity <= item.product.minStock)
  }

  return items
}
