import { createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../../../apps/api/src/middleware/authenticate'

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
}

export default reportsRoute

