import { prisma } from '@dflow/db'

export const listWarehouses = async (tenantId: string) =>
  prisma.warehouse.findMany({
    where: { tenantId, isActive: true },
    orderBy: { code: 'asc' }
  })

export const getWarehouseWithLocations = async (tenantId: string, id: string) =>
  prisma.warehouse.findFirst({
    where: { tenantId, id },
    include: {
      locations: {
        where: { isActive: true },
        orderBy: { code: 'asc' }
      }
    }
  })
