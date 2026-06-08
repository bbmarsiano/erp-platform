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

  fastify.get(
    '/reports/movements-by-period',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Движения по период',
        description: 'Движения групирани по ден с IN/OUT количества'
      }
    },
    async (request) => {
      const { dateFrom, dateTo } = request.query as { dateFrom?: string; dateTo?: string }
      const from = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const to = dateTo ? new Date(dateTo) : new Date()
      to.setHours(23, 59, 59, 999)

      const movements = await prisma.stockMovement.findMany({
        where: {
          tenantId: request.user.tenantId,
          createdAt: { gte: from, lte: to }
        },
        include: { product: { select: { code: true, name: true, unit: true } } },
        orderBy: { createdAt: 'asc' }
      })

      const byDate: Record<
        string,
        { date: string; in: number; out: number; inQty: number; outQty: number }
      > = {}
      for (const m of movements) {
        const date = m.createdAt.toISOString().slice(0, 10)
        if (!byDate[date]) byDate[date] = { date, in: 0, out: 0, inQty: 0, outQty: 0 }
        if (m.movementType === 'IN') {
          byDate[date].in++
          byDate[date].inQty += m.quantity
        }
        if (m.movementType === 'OUT') {
          byDate[date].out++
          byDate[date].outQty += m.quantity
        }
      }

      return createSuccessResponse({
        chart: Object.values(byDate),
        movements,
        summary: {
          totalIn: movements.filter((m) => m.movementType === 'IN').length,
          totalOut: movements.filter((m) => m.movementType === 'OUT').length,
          totalInQty: movements
            .filter((m) => m.movementType === 'IN')
            .reduce((s, m) => s + m.quantity, 0),
          totalOutQty: movements
            .filter((m) => m.movementType === 'OUT')
            .reduce((s, m) => s + m.quantity, 0)
        }
      })
    }
  )

  fastify.get(
    '/reports/stock-by-product',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Наличности по продукт',
        description: 'Текущи наличности по продукт'
      }
    },
    async (request) => {
      const products = await prisma.product.findMany({
        where: { tenantId: request.user.tenantId, isActive: true },
        include: { stockItems: true }
      })

      const data = products
        .map((p) => {
          const quantity = p.stockItems.reduce((s, si) => s + si.quantity, 0)
          return {
            name: p.name,
            code: p.code,
            unit: p.unit,
            quantity,
            minStock: p.minStock,
            status: quantity < p.minStock ? 'Под минимум' : 'Нормално'
          }
        })
        .sort((a, b) => b.quantity - a.quantity)

      return createSuccessResponse(data)
    }
  )

  fastify.get(
    '/reports/receipts-by-period',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Приходи по период',
        description: 'Приходни бележки групирани по ден'
      }
    },
    async (request) => {
      const { dateFrom, dateTo } = request.query as { dateFrom?: string; dateTo?: string }
      const from = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const to = dateTo ? new Date(dateTo) : new Date()
      to.setHours(23, 59, 59, 999)

      const receipts = await prisma.goodsReceipt.findMany({
        where: { tenantId: request.user.tenantId, createdAt: { gte: from, lte: to } },
        include: { lines: true, warehouse: { select: { name: true } } },
        orderBy: { createdAt: 'asc' }
      })

      const byDay: Record<string, number> = {}
      for (const r of receipts) {
        const date = r.createdAt.toISOString().slice(0, 10)
        byDay[date] = (byDay[date] || 0) + 1
      }

      return createSuccessResponse({
        chart: Object.entries(byDay).map(([date, count]) => ({ date, count })),
        receipts,
        summary: {
          total: receipts.length,
          confirmed: receipts.filter((r) => r.status === 'CONFIRMED').length,
          draft: receipts.filter((r) => r.status === 'DRAFT').length
        }
      })
    }
  )
}

export default reportsRoute
