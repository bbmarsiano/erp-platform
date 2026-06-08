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

  fastify.get(
    '/reports/sales-by-period',
    { preHandler: [authenticate], schema: { tags: ['POS'], summary: 'Продажби по период' } },
    async (request) => {
      const { dateFrom, dateTo } = request.query as { dateFrom?: string; dateTo?: string }
      const from = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const to = dateTo ? new Date(dateTo) : new Date()
      to.setHours(23, 59, 59, 999)

      const sales = await prisma.sale.findMany({
        where: {
          tenantId: request.user.tenantId,
          status: 'COMPLETED',
          createdAt: { gte: from, lte: to }
        },
        include: {
          lines: { include: { product: { select: { name: true, code: true } } } },
          cashRegister: { select: { name: true } }
        },
        orderBy: { createdAt: 'asc' }
      })

      const byDay: Record<string, { date: string; count: number; revenue: number }> = {}
      for (const s of sales) {
        const date = s.createdAt.toISOString().slice(0, 10)
        if (!byDay[date]) byDay[date] = { date, count: 0, revenue: 0 }
        byDay[date].count++
        byDay[date].revenue += s.totalAmount
      }

      const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)

      return createSuccessResponse({
        chart: Object.values(byDay),
        sales,
        summary: {
          total: sales.length,
          totalRevenue,
          avgSale: sales.length ? totalRevenue / sales.length : 0,
          cash: sales.filter((s) => s.paymentMethod === 'CASH').length,
          card: sales.filter((s) => s.paymentMethod === 'CARD').length
        }
      })
    }
  )

  fastify.get(
    '/reports/top-products',
    { preHandler: [authenticate], schema: { tags: ['POS'], summary: 'Топ артикули по период' } },
    async (request) => {
      const { dateFrom, dateTo } = request.query as { dateFrom?: string; dateTo?: string }
      const from = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const to = dateTo ? new Date(dateTo) : new Date()
      to.setHours(23, 59, 59, 999)

      const lines = await prisma.saleLine.findMany({
        where: {
          sale: {
            tenantId: request.user.tenantId,
            status: 'COMPLETED',
            createdAt: { gte: from, lte: to }
          }
        },
        include: { product: { select: { name: true, code: true } } }
      })

      const byProduct: Record<string, { name: string; code: string; qty: number; revenue: number }> = {}
      for (const l of lines) {
        const key = l.productId
        if (!byProduct[key]) {
          byProduct[key] = { name: l.product.name, code: l.product.code, qty: 0, revenue: 0 }
        }
        byProduct[key].qty += l.quantity
        byProduct[key].revenue += l.totalPrice
      }

      const data = Object.values(byProduct).sort((a, b) => b.revenue - a.revenue)
      return createSuccessResponse(data)
    }
  )

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

