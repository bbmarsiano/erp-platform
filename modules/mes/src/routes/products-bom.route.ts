import { createErrorResponse, createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../../../apps/api/src/middleware/authenticate'
import type { BomItemInput } from '../types/mes.types'

const productsBomRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/bom', { preHandler: [authenticate], schema: { tags: ['MES'] } }, async (request) => {
    const data = await prisma.billOfMaterials.findMany({
      where: { tenantId: request.user.tenantId },
      include: { product: true, items: true },
      orderBy: { createdAt: 'desc' }
    })
    return createSuccessResponse(data)
  })

  fastify.post('/bom', { preHandler: [authenticate] }, async (request) => {
    const body = request.body as { productId: string; version?: string; isActive?: boolean }
    const created = await prisma.billOfMaterials.create({
      data: {
        tenantId: request.user.tenantId,
        productId: body.productId,
        version: body.version ?? '1.0',
        isActive: body.isActive ?? true
      }
    })
    return createSuccessResponse(created)
  })

  fastify.get('/bom/:productId', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { productId: string }
    const bom = await prisma.billOfMaterials.findFirst({
      where: { tenantId: request.user.tenantId, productId: params.productId },
      include: { product: true, items: { include: { component: true } } }
    })
    if (!bom) {
      return reply.status(404).send(createErrorResponse('BOM not found', 'BOM_NOT_FOUND', 404))
    }
    return createSuccessResponse(bom)
  })

  fastify.put('/bom/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const body = request.body as { version?: string; isActive?: boolean }
    const updated = await prisma.billOfMaterials.updateMany({
      where: { id: params.id, tenantId: request.user.tenantId },
      data: { version: body.version, isActive: body.isActive }
    })
    if (!updated.count) {
      return reply.status(404).send(createErrorResponse('BOM not found', 'BOM_NOT_FOUND', 404))
    }
    return createSuccessResponse({ updated: true })
  })

  fastify.post('/bom/:id/items', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const body = request.body as BomItemInput
    const bom = await prisma.billOfMaterials.findFirst({ where: { id: params.id, tenantId: request.user.tenantId } })
    if (!bom) {
      return reply.status(404).send(createErrorResponse('BOM not found', 'BOM_NOT_FOUND', 404))
    }
    const item = await prisma.bomItem.create({
      data: { bomId: bom.id, componentId: body.componentId, quantity: body.quantity, unit: body.unit, note: body.note }
    })
    return createSuccessResponse(item)
  })

  fastify.delete('/bom/:id/items/:itemId', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string; itemId: string }
    const bom = await prisma.billOfMaterials.findFirst({ where: { id: params.id, tenantId: request.user.tenantId } })
    if (!bom) {
      return reply.status(404).send(createErrorResponse('BOM not found', 'BOM_NOT_FOUND', 404))
    }
    await prisma.bomItem.deleteMany({ where: { id: params.itemId, bomId: bom.id } })
    return createSuccessResponse({ deleted: true })
  })
}

export default productsBomRoute

