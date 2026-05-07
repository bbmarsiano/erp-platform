import { createErrorResponse, createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../../../apps/api/src/middleware/authenticate'
import { getWarehouseWithLocations, listWarehouses } from '../services/warehouse.service'

const warehousesRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get(
    '/warehouses',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Списък на складовете',
        description: 'Връща всички активни складове за текущия tenant'
      }
    },
    async (request) => {
      const data = await listWarehouses(request.user.tenantId)
      return createSuccessResponse(data)
    }
  )

  fastify.post(
    '/warehouses',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Създаване на склад',
        description: 'Създава нов склад в рамките на tenant'
      }
    },
    async (request, reply) => {
      const body = request.body as { code: string; name: string; address?: string }
      try {
        const created = await prisma.warehouse.create({
          data: {
            tenantId: request.user.tenantId,
            code: body.code,
            name: body.name,
            address: body.address
          }
        })
        return createSuccessResponse(created)
      } catch {
        return reply.status(400).send(createErrorResponse('Warehouse code already exists', 'WAREHOUSE_EXISTS', 400))
      }
    }
  )

  fastify.get(
    '/warehouses/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Детайли за склад',
        description: 'Връща склад с неговите локации'
      }
    },
    async (request, reply) => {
      const params = request.params as { id: string }
      const warehouse = await getWarehouseWithLocations(request.user.tenantId, params.id)
      if (!warehouse) {
        return reply.status(404).send(createErrorResponse('Warehouse not found', 'WAREHOUSE_NOT_FOUND', 404))
      }
      return createSuccessResponse(warehouse)
    }
  )

  fastify.put(
    '/warehouses/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Редакция на склад',
        description: 'Обновява данни за съществуващ склад'
      }
    },
    async (request, reply) => {
      const params = request.params as { id: string }
      const body = request.body as { name?: string; address?: string; isActive?: boolean }
      const updated = await prisma.warehouse.updateMany({
        where: { id: params.id, tenantId: request.user.tenantId },
        data: body
      })
      if (updated.count === 0) {
        return reply.status(404).send(createErrorResponse('Warehouse not found', 'WAREHOUSE_NOT_FOUND', 404))
      }
      return createSuccessResponse({ updated: true })
    }
  )

  fastify.delete(
    '/warehouses/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Деактивиране на склад',
        description: 'Soft delete чрез isActive=false'
      }
    },
    async (request, reply) => {
      const params = request.params as { id: string }
      const updated = await prisma.warehouse.updateMany({
        where: { id: params.id, tenantId: request.user.tenantId },
        data: { isActive: false }
      })
      if (updated.count === 0) {
        return reply.status(404).send(createErrorResponse('Warehouse not found', 'WAREHOUSE_NOT_FOUND', 404))
      }
      return createSuccessResponse({ deleted: true })
    }
  )

  fastify.get(
    '/warehouses/:id/locations',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Локации в склад',
        description: 'Връща всички локации за конкретен склад'
      }
    },
    async (request, reply) => {
      const params = request.params as { id: string }
      const warehouse = await prisma.warehouse.findFirst({
        where: { id: params.id, tenantId: request.user.tenantId }
      })
      if (!warehouse) {
        return reply.status(404).send(createErrorResponse('Warehouse not found', 'WAREHOUSE_NOT_FOUND', 404))
      }
      const data = await prisma.location.findMany({
        where: { warehouseId: params.id, isActive: true },
        orderBy: { code: 'asc' }
      })
      return createSuccessResponse(data)
    }
  )

  fastify.post(
    '/warehouses/:id/locations',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Създаване на локация',
        description: 'Добавя нова складова локация'
      }
    },
    async (request, reply) => {
      const params = request.params as { id: string }
      const body = request.body as {
        code: string
        name: string
        zone?: string
        locationType?: 'STORAGE' | 'RECEIVING' | 'DISPATCH' | 'QUARANTINE' | 'PRODUCTION'
      }
      const warehouse = await prisma.warehouse.findFirst({
        where: { id: params.id, tenantId: request.user.tenantId }
      })
      if (!warehouse) {
        return reply.status(404).send(createErrorResponse('Warehouse not found', 'WAREHOUSE_NOT_FOUND', 404))
      }
      try {
        const location = await prisma.location.create({
          data: {
            warehouseId: params.id,
            code: body.code,
            name: body.name,
            zone: body.zone,
            locationType: body.locationType ?? 'STORAGE'
          }
        })
        return createSuccessResponse(location)
      } catch {
        return reply.status(400).send(createErrorResponse('Location code already exists', 'LOCATION_EXISTS', 400))
      }
    }
  )
}

export default warehousesRoute
