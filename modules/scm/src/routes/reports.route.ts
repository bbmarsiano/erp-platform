import { createSuccessResponse, authenticate } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'

const reportsRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/reports/orders-summary', { preHandler: [authenticate], schema: { tags: ['SCM'] } }, async (request) => {
    const grouped = await prisma.purchaseOrder.groupBy({
      by: ['status'],
      where: { tenantId: request.user.tenantId },
      _count: { id: true }
    })
    return createSuccessResponse(grouped)
  })

  fastify.get('/reports/supplier-activity', { preHandler: [authenticate] }, async (request) => {
    const since = new Date()
    since.setDate(since.getDate() - 30)
    const orders = await prisma.purchaseOrder.findMany({
      where: { tenantId: request.user.tenantId, createdAt: { gte: since } },
      include: { supplier: true }
    })
    const grouped = orders.reduce<Record<string, { supplierId: string; supplierName: string; orders: number }>>((acc, po) => {
      if (!acc[po.supplierId]) {
        acc[po.supplierId] = { supplierId: po.supplierId, supplierName: po.supplier.name, orders: 0 }
      }
      acc[po.supplierId].orders += 1
      return acc
    }, {})
    return createSuccessResponse(Object.values(grouped))
  })

  fastify.get('/reports/pending-deliveries', { preHandler: [authenticate] }, async (request) => {
    const data = await prisma.purchaseOrder.findMany({
      where: {
        tenantId: request.user.tenantId,
        status: 'SENT',
        deliveries: { none: {} }
      },
      include: { supplier: true, warehouse: true, lines: true },
      orderBy: { createdAt: 'desc' }
    })
    return createSuccessResponse(data)
  })

  fastify.get(
    '/reports/orders-by-period',
    { preHandler: [authenticate], schema: { tags: ['SCM'], summary: 'Поръчки по период' } },
    async (request) => {
      const { dateFrom, dateTo } = request.query as { dateFrom?: string; dateTo?: string }
      const from = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const to = dateTo ? new Date(dateTo) : new Date()
      to.setHours(23, 59, 59, 999)

      const orders = await prisma.purchaseOrder.findMany({
        where: { tenantId: request.user.tenantId, createdAt: { gte: from, lte: to } },
        include: { supplier: { select: { name: true } }, lines: true },
        orderBy: { createdAt: 'asc' }
      })

      const byDay: Record<string, number> = {}
      for (const o of orders) {
        const date = o.createdAt.toISOString().slice(0, 10)
        byDay[date] = (byDay[date] || 0) + 1
      }

      return createSuccessResponse({
        chart: Object.entries(byDay).map(([date, count]) => ({ date, count })),
        orders,
        summary: {
          total: orders.length,
          sent: orders.filter((o) => o.status === 'SENT').length,
          received: orders.filter((o) => o.status === 'RECEIVED').length,
          draft: orders.filter((o) => o.status === 'DRAFT').length,
          cancelled: orders.filter((o) => o.status === 'CANCELLED').length
        }
      })
    }
  )

  fastify.get(
    '/reports/suppliers-summary',
    { preHandler: [authenticate], schema: { tags: ['SCM'], summary: 'Обобщение по доставчици' } },
    async (request) => {
      const suppliers = await prisma.supplier.findMany({
        where: { tenantId: request.user.tenantId },
        include: { purchaseOrders: true }
      })

      const data = suppliers
        .map((s) => ({
          name: s.name,
          code: s.code,
          total: s.purchaseOrders.length,
          sent: s.purchaseOrders.filter((o) => o.status === 'SENT').length,
          received: s.purchaseOrders.filter((o) => o.status === 'RECEIVED').length,
          isActive: s.isActive
        }))
        .sort((a, b) => b.total - a.total)

      return createSuccessResponse(data)
    }
  )

  fastify.get(
    '/reports/deliveries-by-period',
    { preHandler: [authenticate], schema: { tags: ['SCM'], summary: 'Доставки по период' } },
    async (request) => {
      const { dateFrom, dateTo } = request.query as { dateFrom?: string; dateTo?: string }
      const from = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const to = dateTo ? new Date(dateTo) : new Date()
      to.setHours(23, 59, 59, 999)

      const deliveries = await prisma.delivery.findMany({
        where: { tenantId: request.user.tenantId, createdAt: { gte: from, lte: to } },
        include: { lines: true, purchaseOrder: { include: { supplier: { select: { name: true } } } } },
        orderBy: { createdAt: 'asc' }
      })

      const byDay: Record<string, number> = {}
      for (const d of deliveries) {
        const date = d.createdAt.toISOString().slice(0, 10)
        byDay[date] = (byDay[date] || 0) + 1
      }

      return createSuccessResponse({
        chart: Object.entries(byDay).map(([date, count]) => ({ date, count })),
        deliveries,
        summary: {
          total: deliveries.length,
          confirmed: deliveries.filter((d) => d.status === 'CONFIRMED').length,
          pending: deliveries.filter((d) => d.status === 'DRAFT').length
        }
      })
    }
  )
}

export default reportsRoute

