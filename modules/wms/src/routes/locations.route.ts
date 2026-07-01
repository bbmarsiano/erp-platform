import { createErrorResponse, createSuccessResponse, authenticate } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'

const locationsRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get(
    '/locations',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Списък на локации',
        description: 'Връща локации по избор с филтър по склад'
      }
    },
    async (request) => {
      const query = request.query as { warehouseId?: string }
      const data = await prisma.location.findMany({
        where: {
          ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
          warehouse: { tenantId: request.user.tenantId },
          isActive: true
        },
        include: { warehouse: true },
        orderBy: { code: 'asc' }
      })
      return createSuccessResponse(data)
    }
  )

  fastify.put(
    '/locations/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Редакция на локация',
        description: 'Обновява име, зона или тип на локация'
      }
    },
    async (request, reply) => {
      const params = request.params as { id: string }
      const body = request.body as { name?: string; zone?: string; isActive?: boolean }
      const location = await prisma.location.findFirst({
        where: { id: params.id, warehouse: { tenantId: request.user.tenantId } }
      })
      if (!location) {
        return reply.status(404).send(createErrorResponse('Location not found', 'LOCATION_NOT_FOUND', 404))
      }
      const updated = await prisma.location.update({
        where: { id: params.id },
        data: body
      })
      return createSuccessResponse(updated)
    }
  )

  fastify.delete(
    '/locations/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Деактивиране на локация',
        description: 'Soft delete на локация'
      }
    },
    async (request, reply) => {
      const params = request.params as { id: string }
      const location = await prisma.location.findFirst({
        where: { id: params.id, warehouse: { tenantId: request.user.tenantId } }
      })
      if (!location) {
        return reply.status(404).send(createErrorResponse('Location not found', 'LOCATION_NOT_FOUND', 404))
      }
      await prisma.location.update({
        where: { id: params.id },
        data: { isActive: false }
      })
      return createSuccessResponse({ deleted: true })
    }
  )
}

export default locationsRoute
