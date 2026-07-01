import { createErrorResponse, createSuccessResponse, authenticate } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { listPurchaseOrders } from '../services/purchase-order.service'
import type { PurchaseOrderLineInput } from '../types/scm.types'

const purchaseOrdersRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/orders', { preHandler: [authenticate], schema: { tags: ['SCM'] } }, async (request) => {
    const query = request.query as { status?: string; supplierId?: string }
    const data = await listPurchaseOrders(request.user.tenantId, query)
    return createSuccessResponse(data)
  })

  fastify.post('/orders', { preHandler: [authenticate] }, async (request) => {
    const body = request.body as { supplierId: string; warehouseId: string; expectedDate?: string; note?: string }
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const count = await prisma.purchaseOrder.count({
      where: { tenantId: request.user.tenantId, createdAt: { gte: todayStart } }
    })
    const orderNo = `PO-${dateStr}-${String(count + 1).padStart(4, '0')}`
    const created = await prisma.purchaseOrder.create({
      data: {
        tenantId: request.user.tenantId,
        orderNo,
        supplierId: body.supplierId,
        warehouseId: body.warehouseId,
        expectedDate: body.expectedDate ? new Date(body.expectedDate) : undefined,
        note: body.note,
        createdBy: request.user.id
      }
    })
    return createSuccessResponse(created)
  })

  fastify.get('/orders/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const order = await prisma.purchaseOrder.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: { lines: { include: { product: true } }, supplier: true, warehouse: true }
    })
    if (!order) {
      return reply.status(404).send(createErrorResponse('Purchase order not found', 'PO_NOT_FOUND', 404))
    }
    return createSuccessResponse(order)
  })

  fastify.put('/orders/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const body = request.body as { expectedDate?: string; note?: string; supplierId?: string; warehouseId?: string }
    const existing = await prisma.purchaseOrder.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId }
    })
    if (!existing) {
      return reply.status(404).send(createErrorResponse('Purchase order not found', 'PO_NOT_FOUND', 404))
    }
    if (existing.status !== 'DRAFT') {
      return reply.status(400).send(createErrorResponse('Only draft orders can be edited', 'INVALID_STATUS', 400))
    }
    const updated = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        expectedDate: body.expectedDate ? new Date(body.expectedDate) : undefined,
        note: body.note,
        supplierId: body.supplierId,
        warehouseId: body.warehouseId
      }
    })
    return createSuccessResponse(updated)
  })

  fastify.post('/orders/:id/lines', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const body = request.body as PurchaseOrderLineInput
    const order = await prisma.purchaseOrder.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId }
    })
    if (!order) {
      return reply.status(404).send(createErrorResponse('Purchase order not found', 'PO_NOT_FOUND', 404))
    }
    if (order.status !== 'DRAFT') {
      return reply.status(400).send(createErrorResponse('Only draft orders can be edited', 'INVALID_STATUS', 400))
    }
    const line = await prisma.purchaseOrderLine.create({
      data: {
        purchaseOrderId: order.id,
        productId: body.productId,
        quantity: body.quantity,
        unitPrice: body.unitPrice,
        unit: body.unit
      },
      include: { product: true }
    })
    return createSuccessResponse(line)
  })

  fastify.post('/orders/:id/send', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const order = await prisma.purchaseOrder.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId }
    })
    if (!order) {
      return reply.status(404).send(createErrorResponse('Purchase order not found', 'PO_NOT_FOUND', 404))
    }
    if (order.status !== 'DRAFT') {
      return reply.status(400).send(createErrorResponse('Only draft orders can be sent', 'INVALID_STATUS', 400))
    }
    const updated = await prisma.purchaseOrder.update({
      where: { id: order.id },
      data: { status: 'SENT' }
    })
    return createSuccessResponse(updated)
  })

  fastify.post('/orders/:id/cancel', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const updated = await prisma.purchaseOrder.updateMany({
      where: { id: params.id, tenantId: request.user.tenantId },
      data: { status: 'CANCELLED' }
    })
    if (!updated.count) {
      return reply.status(404).send(createErrorResponse('Purchase order not found', 'PO_NOT_FOUND', 404))
    }
    return createSuccessResponse({ cancelled: true })
  })
}

export default purchaseOrdersRoute

