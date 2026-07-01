import { createSuccessResponse, authenticate } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'

const reportsRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/reports/summary', { preHandler: [authenticate], schema: { tags: ['MES'] } }, async (request) => {
    const grouped = await prisma.workOrder.groupBy({
      by: ['status'],
      where: { tenantId: request.user.tenantId },
      _count: { id: true }
    })
    return createSuccessResponse(grouped)
  })

  fastify.get('/reports/efficiency', { preHandler: [authenticate] }, async (request) => {
    const orders = await prisma.workOrder.findMany({
      where: { tenantId: request.user.tenantId, status: 'COMPLETED' },
      include: { product: true }
    })
    const grouped = orders.reduce<Record<string, { productId: string; productCode: string; planned: number; produced: number }>>(
      (acc, wo) => {
        if (!acc[wo.productId]) {
          acc[wo.productId] = { productId: wo.productId, productCode: wo.product.code, planned: 0, produced: 0 }
        }
        acc[wo.productId].planned += wo.plannedQty
        acc[wo.productId].produced += wo.producedQty
        return acc
      },
      {}
    )
    return createSuccessResponse(Object.values(grouped))
  })

  fastify.get(
    '/reports/orders-by-period',
    { preHandler: [authenticate], schema: { tags: ['MES'], summary: 'Производствени нареждания по период' } },
    async (request) => {
      const { dateFrom, dateTo } = request.query as { dateFrom?: string; dateTo?: string }
      const from = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const to = dateTo ? new Date(dateTo) : new Date()
      to.setHours(23, 59, 59, 999)

      const orders = await prisma.workOrder.findMany({
        where: { tenantId: request.user.tenantId, createdAt: { gte: from, lte: to } },
        include: {
          product: { select: { name: true, code: true, unit: true } },
          bom: { include: { product: true } },
          consumptions: true
        },
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
          inProgress: orders.filter((o) => o.status === 'IN_PROGRESS').length,
          completed: orders.filter((o) => o.status === 'COMPLETED').length,
          planned: orders.filter((o) => o.status === 'RELEASED' || o.status === 'DRAFT').length,
          cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
          totalQty: orders.reduce((s, o) => s + o.plannedQty, 0)
        }
      })
    }
  )

  fastify.get(
    '/reports/bom-summary',
    { preHandler: [authenticate], schema: { tags: ['MES'], summary: 'Обобщение рецептури' } },
    async (request) => {
      const boms = await prisma.billOfMaterials.findMany({
        where: { tenantId: request.user.tenantId },
        include: { product: true, items: { include: { component: true } } }
      })

      const data = boms.map((b) => ({
        name: b.product.name,
        product: b.product.name,
        productCode: b.product.code,
        version: b.version,
        components: b.items.length,
        isActive: b.isActive
      }))

      return createSuccessResponse(data)
    }
  )
}

export default reportsRoute

