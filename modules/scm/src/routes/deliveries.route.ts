import { createErrorResponse, createSuccessResponse, authenticate } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import {
  FinanceAutomationError,
  isFinanceModuleEnabled,
  onScmDeliveryConfirmed
} from '../../../finance/src/services/automation.service'
import { listDeliveries } from '../services/delivery.service'
import type { DeliveryLineInput, DeliveryLineUpdateInput } from '../types/scm.types'

const deliveriesRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/deliveries', { preHandler: [authenticate], schema: { tags: ['SCM'] } }, async (request) => {
    const data = await listDeliveries(request.user.tenantId)
    return createSuccessResponse(data)
  })

  fastify.post('/deliveries', { preHandler: [authenticate] }, async (request) => {
    const body = request.body as {
      purchaseOrderId?: string
      warehouseId: string
      supplierName?: string
      deliveryDate?: string
      note?: string
    }
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const count = await prisma.delivery.count({
      where: { tenantId: request.user.tenantId, createdAt: { gte: todayStart } }
    })
    const deliveryNo = `DLV-${dateStr}-${String(count + 1).padStart(4, '0')}`

    const created = await prisma.delivery.create({
      data: {
        tenantId: request.user.tenantId,
        deliveryNo,
        purchaseOrderId: body.purchaseOrderId,
        warehouseId: body.warehouseId,
        supplierName: body.supplierName,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
        note: body.note,
        createdBy: request.user.id
      }
    })
    return createSuccessResponse(created)
  })

  fastify.get('/deliveries/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const delivery = await prisma.delivery.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: {
        lines: { include: { product: true, location: true } },
        purchaseOrder: { include: { supplier: true, lines: { include: { product: true } } } },
        warehouse: true
      }
    })
    if (!delivery) {
      return reply.status(404).send(createErrorResponse('Delivery not found', 'DELIVERY_NOT_FOUND', 404))
    }
    return createSuccessResponse(delivery)
  })

  fastify.post('/deliveries/:id/lines', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const body = request.body as DeliveryLineInput
    const delivery = await prisma.delivery.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId }
    })
    if (!delivery) {
      return reply.status(404).send(createErrorResponse('Delivery not found', 'DELIVERY_NOT_FOUND', 404))
    }
    if (delivery.status !== 'DRAFT') {
      return reply.status(400).send(createErrorResponse('Only draft deliveries can be edited', 'INVALID_STATUS', 400))
    }
    const line = await prisma.deliveryLine.create({
      data: {
        deliveryId: delivery.id,
        productId: body.productId,
        locationId: body.locationId,
        quantity: body.quantity,
        lotNumber: body.lotNumber,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined
      },
      include: { product: true, location: true }
    })
    return createSuccessResponse(line)
  })

  fastify.put('/deliveries/:id/items/:itemId', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string; itemId: string }
    const body = request.body as DeliveryLineUpdateInput

    const delivery = await prisma.delivery.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId }
    })
    if (!delivery) {
      return reply.status(404).send(createErrorResponse('Delivery not found', 'DELIVERY_NOT_FOUND', 404))
    }
    if (delivery.status !== 'DRAFT') {
      return reply.status(400).send(createErrorResponse('Only draft deliveries can be edited', 'INVALID_STATUS', 400))
    }

    const existing = await prisma.deliveryLine.findFirst({
      where: { id: params.itemId, deliveryId: delivery.id }
    })
    if (!existing) {
      return reply.status(404).send(createErrorResponse('Delivery line not found', 'DELIVERY_LINE_NOT_FOUND', 404))
    }

    const updated = await prisma.deliveryLine.update({
      where: { id: params.itemId },
      data: {
        locationId: body.locationId,
        quantity: body.quantity,
        lotNumber: body.lotNumber ?? null
      },
      include: { product: true, location: true }
    })
    return createSuccessResponse(updated)
  })

  fastify.delete('/deliveries/:id/items/:itemId', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string; itemId: string }

    const delivery = await prisma.delivery.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId }
    })
    if (!delivery) {
      return reply.status(404).send(createErrorResponse('Delivery not found', 'DELIVERY_NOT_FOUND', 404))
    }
    if (delivery.status !== 'DRAFT') {
      return reply.status(400).send(createErrorResponse('Only draft deliveries can be edited', 'INVALID_STATUS', 400))
    }

    const existing = await prisma.deliveryLine.findFirst({
      where: { id: params.itemId, deliveryId: delivery.id }
    })
    if (!existing) {
      return reply.status(404).send(createErrorResponse('Delivery line not found', 'DELIVERY_LINE_NOT_FOUND', 404))
    }

    await prisma.deliveryLine.delete({ where: { id: params.itemId } })
    return createSuccessResponse({ deleted: true })
  })

  fastify.post('/deliveries/:id/confirm', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    try {
      const result = await prisma.$transaction(async (tx) => {
        const delivery = await tx.delivery.findFirst({
          where: { id: params.id, tenantId: request.user.tenantId },
          include: { lines: true, purchaseOrder: { include: { lines: true } } }
        })
        if (!delivery) throw new Error('DELIVERY_NOT_FOUND')
        if (delivery.status !== 'DRAFT') throw new Error('DELIVERY_NOT_DRAFT')

        const now = new Date()
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const receiptCount = await tx.goodsReceipt.count({
          where: { tenantId: request.user.tenantId, createdAt: { gte: todayStart } }
        })
        const receiptNo = `REC-${dateStr}-${String(receiptCount + 1).padStart(4, '0')}`

        const receipt = await tx.goodsReceipt.create({
          data: {
            tenantId: request.user.tenantId,
            receiptNo,
            warehouseId: delivery.warehouseId,
            supplierName: delivery.supplierName,
            note: `Автоматично от доставка ${delivery.deliveryNo}`,
            status: 'CONFIRMED',
            createdBy: request.user.id,
            lines: {
              create: delivery.lines.map((line) => ({
                productId: line.productId,
                locationId: line.locationId,
                quantity: line.quantity,
                lotNumber: line.lotNumber ?? null,
                expiryDate: line.expiryDate ?? null
              }))
            }
          }
        })

        for (const line of delivery.lines) {
          const lotNumber = line.lotNumber ?? null

          if (lotNumber) {
            await tx.stockItem.upsert({
              where: {
                productId_locationId_lotNumber: {
                  productId: line.productId,
                  locationId: line.locationId,
                  lotNumber
                }
              },
              update: {
                quantity: { increment: line.quantity },
                expiryDate: line.expiryDate ?? undefined
              },
              create: {
                tenantId: request.user.tenantId,
                productId: line.productId,
                locationId: line.locationId,
                quantity: line.quantity,
                lotNumber,
                expiryDate: line.expiryDate ?? undefined
              }
            })
          } else {
            const existingRows = await tx.stockItem.findMany({
              where: {
                tenantId: request.user.tenantId,
                productId: line.productId,
                locationId: line.locationId,
                lotNumber: null
              },
              orderBy: { quantity: 'desc' }
            })

            if (existingRows.length > 0) {
              const [primary, ...duplicates] = existingRows
              if (duplicates.length > 0) {
                const mergedQty = duplicates.reduce((sum, row) => sum + row.quantity, 0)
                await tx.stockItem.update({
                  where: { id: primary.id },
                  data: { quantity: { increment: mergedQty } }
                })
                await tx.stockItem.deleteMany({
                  where: { id: { in: duplicates.map((row) => row.id) } }
                })
              }
              await tx.stockItem.update({
                where: { id: primary.id },
                data: {
                  quantity: { increment: line.quantity },
                  expiryDate: line.expiryDate ?? undefined
                }
              })
            } else {
              await tx.stockItem.create({
                data: {
                  tenantId: request.user.tenantId,
                  productId: line.productId,
                  locationId: line.locationId,
                  quantity: line.quantity,
                  lotNumber: null,
                  expiryDate: line.expiryDate ?? undefined
                }
              })
            }
          }

          await tx.stockMovement.create({
            data: {
              tenantId: request.user.tenantId,
              productId: line.productId,
              movementType: 'IN',
              quantity: line.quantity,
              toLocationId: line.locationId,
              referenceType: 'DELIVERY',
              referenceId: delivery.id,
              lotNumber: line.lotNumber ?? null,
              createdBy: request.user.id
            }
          })
        }

        if (delivery.purchaseOrderId) {
          const receivedByProduct = delivery.lines.reduce<Record<string, number>>((acc, line) => {
            acc[line.productId] = (acc[line.productId] ?? 0) + line.quantity
            return acc
          }, {})

          for (const poLine of delivery.purchaseOrder?.lines ?? []) {
            const addQty = receivedByProduct[poLine.productId] ?? 0
            if (addQty > 0) {
              await tx.purchaseOrderLine.update({
                where: { id: poLine.id },
                data: { receivedQty: { increment: addQty } }
              })
            }
          }

          const refreshed = await tx.purchaseOrder.findUnique({
            where: { id: delivery.purchaseOrderId },
            include: { lines: true }
          })
          if (refreshed) {
            const fullyReceived = refreshed.lines.every((l) => l.receivedQty >= l.quantity)
            await tx.purchaseOrder.update({
              where: { id: refreshed.id },
              data: { status: fullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED' }
            })
          }
        }

        const confirmedDelivery = await tx.delivery.update({
          where: { id: delivery.id },
          data: { status: 'CONFIRMED', goodsReceiptId: receipt.id }
        })

        const tenant = await tx.tenant.findUnique({
          where: { id: request.user.tenantId },
          select: { enabledModules: true }
        })

        let draftInvoiceId: string | undefined
        if (isFinanceModuleEnabled(tenant?.enabledModules)) {
          const automation = await onScmDeliveryConfirmed(tx, {
            deliveryId: delivery.id,
            userId: request.user.id,
            tenantId: request.user.tenantId
          })
          draftInvoiceId = automation.draftInvoiceId
        }

        return { ...confirmedDelivery, goodsReceiptNo: receipt.receiptNo, draftInvoiceId }
      })

      return createSuccessResponse(result)
    } catch (error) {
      if (error instanceof FinanceAutomationError) {
        return reply.status(500).send({
          ...createErrorResponse(error.userMessage, error.code, 500),
          details: error.message
        })
      }
      const message = (error as Error).message
      if (message === 'DELIVERY_NOT_FOUND') {
        return reply.status(404).send(createErrorResponse('Delivery not found', 'DELIVERY_NOT_FOUND', 404))
      }
      if (message === 'DELIVERY_NOT_DRAFT') {
        return reply.status(400).send(createErrorResponse('Only draft deliveries can be confirmed', 'INVALID_STATUS', 400))
      }
      throw error
    }
  })

  fastify.post('/deliveries/:id/cancel', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const updated = await prisma.delivery.updateMany({
      where: { id: params.id, tenantId: request.user.tenantId, status: 'DRAFT' },
      data: { status: 'CANCELLED' }
    })
    if (!updated.count) {
      return reply.status(400).send(createErrorResponse('Only draft deliveries can be cancelled', 'INVALID_STATUS', 400))
    }
    return createSuccessResponse({ cancelled: true })
  })
}

export default deliveriesRoute

