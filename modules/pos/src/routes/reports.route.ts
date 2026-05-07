import { createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../../../apps/api/src/middleware/authenticate'

const reportsRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/reports/daily', { preHandler: [authenticate], schema: { tags: ['POS'] } }, async (request) => {
    const since = new Date()
    since.setDate(since.getDate() - 30)
    const sales = await prisma.sale.findMany({
      where: { tenantId: request.user.tenantId, createdAt: { gte: since }, status: 'COMPLETED' },
      orderBy: { createdAt: 'asc' }
    })
    const grouped = sales.reduce<Record<string, { date: string; total: number; count: number }>>((acc, s) => {
      const date = s.createdAt.toISOString().slice(0, 10)
      if (!acc[date]) acc[date] = { date, total: 0, count: 0 }
      acc[date].total += s.totalAmount
      acc[date].count += 1
      return acc
    }, {})
    return createSuccessResponse(Object.values(grouped))
  })

  fastify.get('/reports/top-products', { preHandler: [authenticate] }, async (request) => {
    const lines = await prisma.saleLine.findMany({
      where: { sale: { tenantId: request.user.tenantId, status: 'COMPLETED' } },
      include: { product: true }
    })
    const grouped = lines.reduce<Record<string, { productId: string; code: string; name: string; quantity: number }>>((acc, l) => {
      if (!acc[l.productId]) {
        acc[l.productId] = { productId: l.productId, code: l.product.code, name: l.product.name, quantity: 0 }
      }
      acc[l.productId].quantity += l.quantity
      return acc
    }, {})
    const top = Object.values(grouped).sort((a, b) => b.quantity - a.quantity).slice(0, 10)
    return createSuccessResponse(top)
  })

  fastify.get('/reports/summary', { preHandler: [authenticate] }, async (request) => {
    const agg = await prisma.sale.aggregate({
      where: { tenantId: request.user.tenantId, status: 'COMPLETED' },
      _count: { id: true },
      _sum: { totalAmount: true },
      _avg: { totalAmount: true }
    })
    return createSuccessResponse({
      totalSales: agg._count.id,
      totalRevenue: agg._sum.totalAmount ?? 0,
      averageSaleValue: agg._avg.totalAmount ?? 0
    })
  })
}

export default reportsRoute

