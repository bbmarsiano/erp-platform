import { createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../../../apps/api/src/middleware/authenticate'

const reportsRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get(
    '/reports/stock-summary',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Справка наличности по склад',
        description: 'Сумира количества и позиции по склад'
      }
    },
    async (request) => {
      const warehouses = await prisma.warehouse.findMany({
        where: { tenantId: request.user.tenantId, isActive: true },
        include: {
          locations: {
            include: {
              stockItems: true
            }
          }
        }
      })

      const data = warehouses.map((warehouse) => ({
        warehouseId: warehouse.id,
        warehouseCode: warehouse.code,
        warehouseName: warehouse.name,
        totalItems: warehouse.locations.reduce((acc, location) => acc + location.stockItems.length, 0),
        totalQuantity: warehouse.locations.reduce(
          (acc, location) => acc + location.stockItems.reduce((inner, item) => inner + item.quantity, 0),
          0
        )
      }))

      return createSuccessResponse(data)
    }
  )

  fastify.get(
    '/reports/movements-summary',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Справка движения по тип',
        description: 'Брой движения по тип за период'
      }
    },
    async (request) => {
      const query = request.query as { dateFrom?: string; dateTo?: string }
      const where = {
        tenantId: request.user.tenantId,
        ...(query.dateFrom || query.dateTo
          ? {
              createdAt: {
                ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
                ...(query.dateTo ? { lte: new Date(query.dateTo) } : {})
              }
            }
          : {})
      }

      const grouped = await prisma.stockMovement.groupBy({
        by: ['movementType'],
        where,
        _count: { id: true }
      })

      return createSuccessResponse(grouped)
    }
  )

  fastify.get(
    '/reports/low-stock',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Справка ниски наличности',
        description: 'Връща продукти под минимално количество'
      }
    },
    async (request) => {
      const stock = await prisma.stockItem.findMany({
        where: { tenantId: request.user.tenantId },
        include: {
          product: true,
          location: true
        }
      })

      const data = stock.filter((item) => item.quantity <= item.product.minStock)
      return createSuccessResponse(data)
    }
  )
}

export default reportsRoute
