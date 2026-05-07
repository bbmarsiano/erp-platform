import { createErrorResponse, createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../../../apps/api/src/middleware/authenticate'

const cashRegisterRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/registers', { preHandler: [authenticate], schema: { tags: ['POS'] } }, async (request) => {
    const data = await prisma.cashRegister.findMany({
      where: { tenantId: request.user.tenantId },
      include: { warehouse: true, location: true },
      orderBy: { code: 'asc' }
    })
    return createSuccessResponse(data)
  })

  fastify.post('/registers', { preHandler: [authenticate] }, async (request) => {
    const body = request.body as { code: string; name: string; warehouseId: string; locationId: string; isActive?: boolean }
    const created = await prisma.cashRegister.create({
      data: {
        tenantId: request.user.tenantId,
        code: body.code,
        name: body.name,
        warehouseId: body.warehouseId,
        locationId: body.locationId,
        isActive: body.isActive ?? true
      }
    })
    return createSuccessResponse(created)
  })

  fastify.get('/registers/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const register = await prisma.cashRegister.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: { warehouse: true, location: true }
    })
    if (!register) return reply.status(404).send(createErrorResponse('Register not found', 'REGISTER_NOT_FOUND', 404))
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    const summary = await prisma.sale.aggregate({
      where: { tenantId: request.user.tenantId, cashRegisterId: register.id, createdAt: { gte: dayStart } },
      _count: { id: true },
      _sum: { totalAmount: true }
    })
    return createSuccessResponse({
      ...register,
      todaySalesCount: summary._count.id,
      todaySalesTotal: summary._sum.totalAmount ?? 0
    })
  })
}

export default cashRegisterRoute

