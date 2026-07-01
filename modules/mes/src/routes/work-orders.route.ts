import { createErrorResponse, createSuccessResponse, authenticate } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { listWorkOrders } from '../services/production.service'
import type { WorkOrderCreateInput } from '../types/mes.types'

async function resolveBomId(tenantId: string, productId: string, bomId?: string) {
  if (bomId) return bomId
  const bom = await prisma.billOfMaterials.findFirst({
    where: { tenantId, productId, isActive: true }
  })
  return bom?.id
}

async function findStockLocationForProduct(tenantId: string, productId: string): Promise<string | null> {
  const stock = await prisma.stockItem.findFirst({
    where: { tenantId, productId, quantity: { gt: 0 } },
    orderBy: { quantity: 'desc' }
  })
  return stock?.locationId ?? null
}

async function createConsumptionLine(
  workOrderId: string,
  productId: string,
  tenantId: string,
  plannedQty: number,
  fallbackWarehouseId?: string
) {
  let locationId = await findStockLocationForProduct(tenantId, productId)
  if (!locationId && fallbackWarehouseId) {
    const fallback = await prisma.location.findFirst({
      where: { warehouseId: fallbackWarehouseId, isActive: true },
      orderBy: { code: 'asc' }
    })
    locationId = fallback?.id ?? null
  }
  if (!locationId) return

  await prisma.materialConsumption.create({
    data: {
      workOrderId,
      productId,
      locationId,
      plannedQty,
      consumedQty: 0
    }
  })
}

async function syncConsumptionLocations(order: {
  id: string
  tenantId: string
  status: string
  warehouseId: string
}) {
  if (order.status === 'COMPLETED' || order.status === 'CANCELLED') return

  const consumptions = await prisma.materialConsumption.findMany({
    where: { workOrderId: order.id }
  })

  for (const c of consumptions) {
    const stockLocationId = await findStockLocationForProduct(order.tenantId, c.productId)
    if (stockLocationId && stockLocationId !== c.locationId) {
      await prisma.materialConsumption.update({
        where: { id: c.id },
        data: { locationId: stockLocationId }
      })
    }
  }
}

async function ensureWorkOrderConsumptions(order: {
  id: string
  tenantId: string
  productId: string
  bomId: string | null
  warehouseId: string
  plannedQty: number
  status: string
}) {
  const count = await prisma.materialConsumption.count({ where: { workOrderId: order.id } })

  if (count === 0) {
    const bomId = await resolveBomId(order.tenantId, order.productId, order.bomId ?? undefined)
    if (!bomId) return

    const bom = await prisma.billOfMaterials.findFirst({
      where: { id: bomId, tenantId: order.tenantId },
      include: { items: true }
    })
    if (!bom?.items.length) return

    for (const item of bom.items) {
      await createConsumptionLine(
        order.id,
        item.componentId,
        order.tenantId,
        item.quantity * order.plannedQty,
        order.warehouseId
      )
    }

    if (!order.bomId) {
      await prisma.workOrder.update({ where: { id: order.id }, data: { bomId } })
    }
  }

  await syncConsumptionLocations(order)
}

const workOrderInclude = {
  product: true,
  warehouse: true,
  bom: { include: { items: { include: { component: true } } } },
  outputLocation: true,
  consumptions: { include: { product: true, location: true } }
} as const

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
    const bomId = await resolveBomId(request.user.tenantId, body.productId, body.bomId)

    const created = await prisma.workOrder.create({
      data: {
        tenantId: request.user.tenantId,
        orderNo,
        productId: body.productId,
        bomId,
        warehouseId: body.warehouseId,
        outputLocationId: body.outputLocationId,
        plannedQty: body.plannedQty,
        plannedStart: body.plannedStart ? new Date(body.plannedStart) : undefined,
        plannedEnd: body.plannedEnd ? new Date(body.plannedEnd) : undefined,
        note: body.note,
        createdBy: request.user.id
      }
    })

    if (bomId) {
      const bom = await prisma.billOfMaterials.findFirst({
        where: { id: bomId, tenantId: request.user.tenantId },
        include: { items: true }
      })
      if (bom) {
          for (const item of bom.items) {
            await createConsumptionLine(
              created.id,
              item.componentId,
              request.user.tenantId,
              item.quantity * body.plannedQty,
              body.warehouseId
            )
          }
      }
    }

    return createSuccessResponse(created)
  })

  fastify.get('/orders/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const existing = await prisma.workOrder.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId }
    })
    if (!existing) return reply.status(404).send(createErrorResponse('Work order not found', 'WO_NOT_FOUND', 404))

    await ensureWorkOrderConsumptions(existing)

    const order = await prisma.workOrder.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: workOrderInclude
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
      where: { id: params.id, tenantId: request.user.tenantId }
    })
    if (!order) return reply.status(404).send(createErrorResponse('Work order not found', 'WO_NOT_FOUND', 404))
    if (order.status !== 'DRAFT') return reply.status(400).send(createErrorResponse('Invalid status', 'INVALID_STATUS', 400))

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
    console.log('[MES complete] workOrderId:', params.id)

    try {
      const order = await prisma.workOrder.findFirst({
        where: { id: params.id, tenantId: request.user.tenantId },
        include: { product: true, consumptions: { include: { product: true, location: true } } }
      })
      if (!order) return reply.status(404).send(createErrorResponse('Work order not found', 'WO_NOT_FOUND', 404))
      if (order.status !== 'IN_PROGRESS') {
        return reply.status(400).send(createErrorResponse('Invalid status', 'INVALID_STATUS', 400))
      }

      console.log('[MES complete] consumptions:', JSON.stringify(order.consumptions))

      await prisma.$transaction(async (tx) => {
        for (const c of order.consumptions) {
          const stockRows = await tx.stockItem.findMany({
            where: {
              tenantId: request.user.tenantId,
              productId: c.productId,
              locationId: c.locationId,
              lotNumber: null
            },
            orderBy: { quantity: 'desc' }
          })
          const available = stockRows.reduce((sum, row) => sum + row.quantity, 0)

          if (available < c.plannedQty) {
            const productCode = c.product?.code ?? c.productId
            const locationCode = c.location?.code ?? c.locationId
            throw new Error(
              `Недостатъчна наличност: ${productCode} в ${locationCode} (налично: ${available}, необходимо: ${c.plannedQty})`
            )
          }

          let remaining = c.plannedQty
          for (const stockItem of stockRows) {
            if (remaining <= 0) break
            const deduct = Math.min(stockItem.quantity, remaining)
            await tx.stockItem.update({
              where: { id: stockItem.id },
              data: { quantity: { decrement: deduct } }
            })
            remaining -= deduct
          }

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

        const outputStockRows = await tx.stockItem.findMany({
          where: {
            tenantId: request.user.tenantId,
            productId: order.productId,
            locationId: order.outputLocationId,
            lotNumber: null
          },
          orderBy: { quantity: 'desc' }
        })

        if (outputStockRows.length > 0) {
          await tx.stockItem.update({
            where: { id: outputStockRows[0].id },
            data: { quantity: { increment: order.plannedQty } }
          })
        } else {
          await tx.stockItem.create({
            data: {
              tenantId: request.user.tenantId,
              productId: order.productId,
              locationId: order.outputLocationId,
              quantity: order.plannedQty,
              lotNumber: null
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

      const completed = await prisma.workOrder.findUnique({
        where: { id: order.id },
        include: workOrderInclude
      })
      return createSuccessResponse(completed)
    } catch (error) {
      const message = (error as Error).message
      console.error('[MES complete] error:', error)
      if (message.includes('Недостатъчна наличност')) {
        return reply.status(400).send(createErrorResponse(message, 'INSUFFICIENT_STOCK', 400))
      }
      if (message === 'WO_NOT_FOUND' || message === 'INVALID_STATUS') {
        return reply.status(400).send(createErrorResponse(message, message, 400))
      }
      return reply.status(500).send(createErrorResponse(message || 'Work order complete failed', 'WO_COMPLETE_FAILED', 500))
    }
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

