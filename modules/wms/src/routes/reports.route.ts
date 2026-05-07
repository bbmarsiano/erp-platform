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
    async (request, reply) => {
      // Returns products where current stock < minStock, including products with zero stock rows.
      const products = await prisma.product.findMany({
        where: { tenantId: request.user.tenantId, isActive: true },
        include: {
          stockItems: {
            where: { location: { warehouse: { isActive: true } } }
          }
        }
      })

      const lowStock = products
        .map((p) => {
          const totalQty = p.stockItems.reduce((sum, s) => sum + s.quantity, 0)
          return { ...p, currentStock: totalQty, stockItems: undefined }
        })
        .filter((p) => p.currentStock < p.minStock)
        .sort((a, b) => a.currentStock - b.currentStock)

      return reply.send({ success: true, data: lowStock })
    }
  )
}

export default reportsRoute
