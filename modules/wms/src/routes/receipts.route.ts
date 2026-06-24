import { createErrorResponse, createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../../../apps/api/src/middleware/authenticate'

const receiptsRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get(
    '/receipts',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Списък приемания',
        description: 'Връща всички документи за приемане'
      }
    },
    async (request) =>
      createSuccessResponse(
        await prisma.goodsReceipt.findMany({
          where: { tenantId: request.user.tenantId },
          orderBy: { createdAt: 'desc' }
        })
      )
  )

  fastify.post(
    '/receipts',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Създаване на приемане',
        description: 'Създава чернова на приемане'
      }
    },
    async (request) => {
      const body = request.body as { warehouseId: string; supplierName?: string; note?: string }

      // Auto-generate receiptNo: format REC-YYYYMMDD-XXXX (sequential per tenant)
      const today = new Date()
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')

      // Count existing receipts today for this tenant to get sequence
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const count = await prisma.goodsReceipt.count({
        where: {
          tenantId: request.user.tenantId,
          createdAt: { gte: todayStart }
        }
      })
      const seq = String(count + 1).padStart(4, '0')
      const receiptNo = `REC-${dateStr}-${seq}`

      const created = await prisma.goodsReceipt.create({
        data: {
          tenantId: request.user.tenantId,
          receiptNo,
          warehouseId: body.warehouseId,
          supplierName: body.supplierName,
          note: body.note,
          createdBy: request.user.id
        }
      })
      return createSuccessResponse(created)
    }
  )

  fastify.post(
    '/receipts/:id/lines',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Добавяне ред към приемане',
        description: 'Добавя ред към чернова на приемане'
      }
    },
    async (request, reply) => {
      const params = request.params as { id: string }
      const body = request.body as { productId: string; locationId: string; quantity: number; lotNumber?: string; expiryDate?: string }

      const receipt = await prisma.goodsReceipt.findFirst({
        where: { id: params.id, tenantId: request.user.tenantId }
      })
      if (!receipt) {
        return reply.status(404).send(createErrorResponse('Receipt not found', 'RECEIPT_NOT_FOUND', 404))
      }
      if (receipt.status !== 'DRAFT') {
        return reply.status(400).send(createErrorResponse('Only draft receipts can be edited', 'INVALID_STATUS', 400))
      }

      const line = await prisma.goodsReceiptLine.create({
        data: {
          receiptId: receipt.id,
          productId: body.productId,
          locationId: body.locationId,
          quantity: body.quantity,
          lotNumber: body.lotNumber,
          expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined
        }
      })
      return createSuccessResponse(line)
    }
  )

  fastify.get(
    '/receipts/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Детайли приемане',
        description: 'Връща документ за приемане с редове'
      }
    },
    async (request, reply) => {
      const params = request.params as { id: string }
      const receipt = await prisma.goodsReceipt.findFirst({
        where: { id: params.id, tenantId: request.user.tenantId },
        include: {
          warehouse: true,
          lines: {
            include: {
              product: true,
              location: true
            }
          }
        }
      })
      if (!receipt) {
        return reply.status(404).send(createErrorResponse('Receipt not found', 'RECEIPT_NOT_FOUND', 404))
      }
      return createSuccessResponse(receipt)
    }
  )

  fastify.put(
    '/receipts/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Редакция приемане',
        description: 'Редактира чернова на приемане'
      }
    },
    async (request, reply) => {
      const params = request.params as { id: string }
      const body = request.body as {
        supplierName?: string
        note?: string
        lines?: Array<{
          productId: string
          locationId: string
          quantity: number
          lotNumber?: string
          expiryDate?: string
        }>
      }

      const receipt = await prisma.goodsReceipt.findFirst({
        where: { id: params.id, tenantId: request.user.tenantId }
      })
      if (!receipt) {
        return reply.status(404).send(createErrorResponse('Receipt not found', 'RECEIPT_NOT_FOUND', 404))
      }
      if (receipt.status !== 'DRAFT') {
        return reply.status(400).send(createErrorResponse('Only draft receipts can be edited', 'INVALID_STATUS', 400))
      }

      const updated = await prisma.$transaction(async (tx) => {
        const receiptUpdate = await tx.goodsReceipt.update({
          where: { id: params.id },
          data: {
            supplierName: body.supplierName,
            note: body.note
          }
        })
        if (body.lines) {
          await tx.goodsReceiptLine.deleteMany({ where: { receiptId: params.id } })
          await tx.goodsReceiptLine.createMany({
            data: body.lines.map((line) => ({
              receiptId: params.id,
              productId: line.productId,
              locationId: line.locationId,
              quantity: line.quantity,
              lotNumber: line.lotNumber,
              expiryDate: line.expiryDate ? new Date(line.expiryDate) : undefined
            }))
          })
        }
        return receiptUpdate
      })

      return createSuccessResponse(updated)
    }
  )

  fastify.post(
    '/receipts/:id/confirm',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Потвърждаване приемане',
        description: 'Потвърждава приемане, увеличава наличностите и създава IN движения'
      }
    },
    async (request, reply) => {
      const params = request.params as { id: string }

      try {
        const result = await prisma.$transaction(async (tx) => {
          const receipt = await tx.goodsReceipt.findFirst({
            where: { id: params.id, tenantId: request.user.tenantId },
            include: { lines: true }
          })
          if (!receipt) {
            throw new Error('RECEIPT_NOT_FOUND')
          }
          if (receipt.status !== 'DRAFT') {
            throw new Error('RECEIPT_NOT_DRAFT')
          }

          for (const line of receipt.lines) {
            if (line.lotNumber) {
              await tx.stockItem.upsert({
                where: {
                  productId_locationId_lotNumber: {
                    productId: line.productId,
                    locationId: line.locationId,
                    lotNumber: line.lotNumber
                  }
                },
                update: {
                  quantity: { increment: line.quantity },
                  expiryDate: line.expiryDate
                },
                create: {
                  tenantId: request.user.tenantId,
                  productId: line.productId,
                  locationId: line.locationId,
                  quantity: line.quantity,
                  lotNumber: line.lotNumber,
                  expiryDate: line.expiryDate
                }
              })
            } else {
              const existing = await tx.stockItem.findFirst({
                where: { tenantId: request.user.tenantId, productId: line.productId, locationId: line.locationId, lotNumber: null }
              })
              if (existing) {
                await tx.stockItem.update({
                  where: { id: existing.id },
                  data: {
                    quantity: { increment: line.quantity },
                    expiryDate: line.expiryDate
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
                    expiryDate: line.expiryDate
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
                referenceType: 'RECEIPT',
                referenceId: receipt.id,
                lotNumber: line.lotNumber,
                createdBy: request.user.id
              }
            })
          }

          return tx.goodsReceipt.update({
            where: { id: receipt.id },
            data: { status: 'CONFIRMED' }
          })
        })

        return createSuccessResponse(result)
      } catch (error) {
        if ((error as Error).message === 'RECEIPT_NOT_FOUND') {
          return reply.status(404).send(createErrorResponse('Receipt not found', 'RECEIPT_NOT_FOUND', 404))
        }
        if ((error as Error).message === 'RECEIPT_NOT_DRAFT') {
          return reply.status(400).send(createErrorResponse('Receipt already processed', 'INVALID_STATUS', 400))
        }
        throw error
      }
    }
  )

  fastify.post(
    '/receipts/:id/cancel',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Отказ приемане',
        description: 'Анулира документ за приемане'
      }
    },
    async (request, reply) => {
      const params = request.params as { id: string }
      const updated = await prisma.goodsReceipt.updateMany({
        where: { id: params.id, tenantId: request.user.tenantId, status: 'DRAFT' },
        data: { status: 'CANCELLED' }
      })
      if (!updated.count) {
        return reply.status(400).send(createErrorResponse('Only draft receipts can be cancelled', 'INVALID_STATUS', 400))
      }
      return createSuccessResponse({ cancelled: true })
    }
  )
}

export default receiptsRoute
