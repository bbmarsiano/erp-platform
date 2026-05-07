import { createErrorResponse, createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../../../apps/api/src/middleware/authenticate'
import { listWorkOrders } from '../services/production.service'
import type { WorkOrderCreateInput } from '../types/mes.types'

const workOrdersRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/orders', { preHandler: [authenticate], schema: { tags: ['MES'] } }, async (request) => {
    const query = request.query as { status?: string }
    const data = await listWorkOrders(request.user.tenantId, query.status)
    return createSuccessResponse(data)
  })

  fastify.post('/orders', { preHandler: [authenticate] }, async (request) => {
    const body = request.body as WorkOrderCreateInput
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const count = await prisma.workOrder.count({ where: { tenantId: request.user.tenantId, createdAt: { gte: todayStart } } })
    const orderNo = `WO-${dateStr}-${String(count + 1).padStart(4, '0')}`

    const created = await prisma.workOrder.create({
      data: {
        tenantId: request.user.tenantId,
        orderNo,
        productId: body.productId,
        bomId: body.bomId,
        warehouseId: body.warehouseId,
        outputLocationId: body.outputLocationId,
        plannedQty: body.plannedQty,
        plannedStart: body.plannedStart ? new Date(body.plannedStart) : undefined,
        plannedEnd: body.plannedEnd ? new Date(body.plannedEnd) : undefined,
        note: body.note,
        createdBy: request.user.id
      }
    })

    if (body.bomId) {
      const bom = await prisma.billOfMaterials.findFirst({
        where: { id: body.bomId, tenantId: request.user.tenantId },
        include: { items: true }
      })
      if (bom) {
        const defaultLocation = await prisma.location.findFirst({
          where: { warehouseId: body.warehouseId, isActive: true },
          orderBy: { code: 'asc' }
        })
        if (defaultLocation) {
          for (const item of bom.items) {
            await prisma.materialConsumption.create({
              data: {
                workOrderId: created.id,
                productId: item.componentId,
                locationId: defaultLocation.id,
                plannedQty: item.quantity * body.plannedQty,
                consumedQty: 0
              }
            })
          }
        }
      }
    }

    return createSuccessResponse(created)
  })

  fastify.get('/orders/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const order = await prisma.workOrder.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: {
        product: true,
        bom: { include: { items: { include: { component: true } } } },
        outputLocation: true,
        consumptions: { include: { product: true, location: true } }
      }
    })
    if (!order) return reply.status(404).send(createErrorResponse('Work order not found', 'WO_NOT_FOUND', 404))
    return createSuccessResponse(order)
  })

  fastify.put('/orders/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const body = request.body as Partial<WorkOrderCreateInput>
    const existing = await prisma.workOrder.findFirst({ where: { id: params.id, tenantId: request.user.tenantId } })
    if (!existing) return reply.status(404).send(createErrorResponse('Work order not found', 'WO_NOT_FOUND', 404))
    if (existing.status !== 'DRAFT') {
      return reply.status(400).send(createErrorResponse('Only draft orders can be edited', 'INVALID_STATUS', 400))
    }
    const updated = await prisma.workOrder.update({
      where: { id: existing.id },
      data: {
        plannedQty: body.plannedQty,
        plannedStart: body.plannedStart ? new Date(body.plannedStart) : undefined,
        plannedEnd: body.plannedEnd ? new Date(body.plannedEnd) : undefined,
        note: body.note,
        bomId: body.bomId
      }
    })
    return createSuccessResponse(updated)
  })

  fastify.post('/orders/:id/release', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const order = await prisma.workOrder.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: { consumptions: { include: { product: true } } }
    })
    if (!order) return reply.status(404).send(createErrorResponse('Work order not found', 'WO_NOT_FOUND', 404))
    if (order.status !== 'DRAFT') return reply.status(400).send(createErrorResponse('Invalid status', 'INVALID_STATUS', 400))

    for (const c of order.consumptions) {
      const available = await prisma.stockItem.aggregate({
        where: { tenantId: request.user.tenantId, productId: c.productId, locationId: c.locationId },
        _sum: { quantity: true }
      })
      if ((available._sum.quantity ?? 0) < c.plannedQty) {
        return reply
          .status(400)
          .send(createErrorResponse(`Недостатъчна наличност: ${c.product.name}`, 'INSUFFICIENT_STOCK', 400))
      }
    }
    const updated = await prisma.workOrder.update({ where: { id: order.id }, data: { status: 'RELEASED' } })
    return createSuccessResponse(updated)
  })

  fastify.post('/orders/:id/start', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const order = await prisma.workOrder.findFirst({ where: { id: params.id, tenantId: request.user.tenantId } })
    if (!order) return reply.status(404).send(createErrorResponse('Work order not found', 'WO_NOT_FOUND', 404))
    if (order.status !== 'RELEASED') return reply.status(400).send(createErrorResponse('Invalid status', 'INVALID_STATUS', 400))
    const updated = await prisma.workOrder.update({
      where: { id: order.id },
      data: { status: 'IN_PROGRESS', actualStart: new Date() }
    })
    return createSuccessResponse(updated)
  })

  fastify.post('/orders/:id/complete', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const order = await prisma.workOrder.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: { product: true, consumptions: { include: { product: true } } }
    })
    if (!order) return reply.status(404).send(createErrorResponse('Work order not found', 'WO_NOT_FOUND', 404))
    if (order.status !== 'IN_PROGRESS') {
      return reply.status(400).send(createErrorResponse('Invalid status', 'INVALID_STATUS', 400))
    }

    await prisma.$transaction(async (tx) => {
      for (const c of order.consumptions) {
        const stockItem = await tx.stockItem.findFirst({
          where: { tenantId: request.user.tenantId, productId: c.productId, locationId: c.locationId }
        })
        if (!stockItem || stockItem.quantity < c.plannedQty) {
          throw new Error(`Недостатъчна наличност: ${c.product.name}`)
        }
        await tx.stockItem.update({ where: { id: stockItem.id }, data: { quantity: { decrement: c.plannedQty } } })
        await tx.stockMovement.create({
          data: {
            tenantId: request.user.tenantId,
            productId: c.productId,
            movementType: 'OUT',
            quantity: c.plannedQty,
            fromLocationId: c.locationId,
            referenceType: 'WORK_ORDER',
            referenceId: order.id,
            note: `Производство: ${order.orderNo}`
          }
        })
        await tx.materialConsumption.update({ where: { id: c.id }, data: { consumedQty: c.plannedQty } })
      }

      const existing = await tx.stockItem.findFirst({
        where: { tenantId: request.user.tenantId, productId: order.productId, locationId: order.outputLocationId }
      })
      if (existing) {
        await tx.stockItem.update({ where: { id: existing.id }, data: { quantity: { increment: order.plannedQty } } })
      } else {
        await tx.stockItem.create({
          data: {
            tenantId: request.user.tenantId,
            productId: order.productId,
            locationId: order.outputLocationId,
            quantity: order.plannedQty
          }
        })
      }
      await tx.stockMovement.create({
        data: {
          tenantId: request.user.tenantId,
          productId: order.productId,
          movementType: 'IN',
          quantity: order.plannedQty,
          toLocationId: order.outputLocationId,
          referenceType: 'WORK_ORDER',
          referenceId: order.id,
          note: `Произведено: ${order.orderNo}`
        }
      })

      await tx.workOrder.update({
        where: { id: order.id },
        data: { status: 'COMPLETED', producedQty: order.plannedQty, actualEnd: new Date() }
      })
    })

    const completed = await prisma.workOrder.findUnique({ where: { id: order.id } })
    return createSuccessResponse(completed)
  })

  fastify.post('/orders/:id/cancel', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const order = await prisma.workOrder.findFirst({ where: { id: params.id, tenantId: request.user.tenantId } })
    if (!order) return reply.status(404).send(createErrorResponse('Work order not found', 'WO_NOT_FOUND', 404))
    if (order.status === 'COMPLETED') {
      return reply.status(400).send(createErrorResponse('Completed order cannot be cancelled', 'INVALID_STATUS', 400))
    }
    const updated = await prisma.workOrder.update({ where: { id: order.id }, data: { status: 'CANCELLED' } })
    return createSuccessResponse(updated)
  })
}

export default workOrdersRoute

