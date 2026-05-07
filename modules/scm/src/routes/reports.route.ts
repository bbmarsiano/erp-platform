import { createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../../../apps/api/src/middleware/authenticate'

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
}

export default reportsRoute

