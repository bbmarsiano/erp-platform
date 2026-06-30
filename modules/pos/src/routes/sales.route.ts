import { createErrorResponse, createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../../../apps/api/src/middleware/authenticate'
import {
  FinanceAutomationError,
  isFinanceModuleEnabled,
  onPosSaleCompleted
} from '../../../finance/src/services/automation.service'
import { listSales } from '../services/pos.service'

const salesRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/sales', { preHandler: [authenticate], schema: { tags: ['POS'] } }, async (request) => {
    const query = request.query as { date?: string; registerId?: string }
    const data = await listSales(request.user.tenantId, query)
    return createSuccessResponse(data)
  })

  fastify.post('/sales', { preHandler: [authenticate] }, async (request, reply) => {
    const body = request.body as {
      cashRegisterId: string
      customerId?: string
      paymentMethod?: 'CASH' | 'CARD' | 'MIXED'
      note?: string
      lines: Array<{ productId: string; locationId: string; quantity: number; unitPrice: number }>
    }
    if (!body.lines?.length) {
      return reply.status(400).send(createErrorResponse('At least one sale line is required', 'INVALID_LINES', 400))
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        if (body.customerId) {
          const customer = await tx.customer.findFirst({
            where: { id: body.customerId, tenantId: request.user.tenantId, isActive: true }
          })
          if (!customer) {
            throw new Error('INVALID_CUSTOMER')
          }
        }

        const now = new Date()
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const count = await tx.sale.count({
          where: { tenantId: request.user.tenantId, createdAt: { gte: dayStart } }
        })
        const saleNo = `SAL-${dateStr}-${String(count + 1).padStart(4, '0')}`

        const totalAmount = body.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0)
        const createdSale = await tx.sale.create({
          data: {
            tenantId: request.user.tenantId,
            saleNo,
            cashRegisterId: body.cashRegisterId,
            customerId: body.customerId ?? null,
            paymentMethod: body.paymentMethod ?? 'CASH',
            totalAmount,
            note: body.note,
            createdBy: request.user.id
          }
        })

        for (const line of body.lines) {
          const stock = await tx.stockItem.findFirst({
            where: { tenantId: request.user.tenantId, productId: line.productId, locationId: line.locationId }
          })
          if (!stock || stock.quantity < line.quantity) {
            throw new Error('INSUFFICIENT_STOCK')
          }
          await tx.stockItem.update({ where: { id: stock.id }, data: { quantity: { decrement: line.quantity } } })
          await tx.stockMovement.create({
            data: {
              tenantId: request.user.tenantId,
              productId: line.productId,
              movementType: 'OUT',
              quantity: line.quantity,
              fromLocationId: line.locationId,
              referenceType: 'SALE',
              referenceId: createdSale.id,
              note: `Продажба: ${saleNo}`,
              createdBy: request.user.id
            }
          })
          await tx.saleLine.create({
            data: {
              saleId: createdSale.id,
              productId: line.productId,
              locationId: line.locationId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              totalPrice: line.quantity * line.unitPrice,
              lotNumber: stock.lotNumber
            }
          })
        }

        const tenant = await tx.tenant.findUnique({
          where: { id: request.user.tenantId },
          select: { enabledModules: true }
        })

        let draftInvoiceId: string | undefined
        if (isFinanceModuleEnabled(tenant?.enabledModules)) {
          const automation = await onPosSaleCompleted(tx, {
            saleId: createdSale.id,
            userId: request.user.id,
            tenantId: request.user.tenantId
          })
          draftInvoiceId = automation.draftInvoiceId
        }

        const sale = await tx.sale.findUnique({
          where: { id: createdSale.id },
          include: { lines: true, customer: true }
        })

        return { sale, draftInvoiceId }
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
      if (message === 'INSUFFICIENT_STOCK') {
        return reply.status(400).send(createErrorResponse('Недостатъчна наличност', 'INSUFFICIENT_STOCK', 400))
      }
      if (message === 'INVALID_CUSTOMER') {
        return reply.status(400).send(createErrorResponse('Невалиден клиент', 'INVALID_CUSTOMER', 400))
      }
      throw error
    }
  })

  fastify.get('/sales/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const sale = await prisma.sale.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: { cashRegister: true, customer: true, lines: { include: { product: true, location: true } } }
    })
    if (!sale) return reply.status(404).send(createErrorResponse('Sale not found', 'SALE_NOT_FOUND', 404))
    return createSuccessResponse(sale)
  })

  fastify.post('/sales/:id/refund', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const sale = await prisma.sale.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: { lines: true }
    })
    if (!sale) return reply.status(404).send(createErrorResponse('Sale not found', 'SALE_NOT_FOUND', 404))
    if (sale.status !== 'COMPLETED') {
      return reply.status(400).send(createErrorResponse('Only completed sales can be refunded', 'INVALID_STATUS', 400))
    }
    await prisma.$transaction(async (tx) => {
      for (const line of sale.lines) {
        const stock = await tx.stockItem.findFirst({
          where: {
            tenantId: request.user.tenantId,
            productId: line.productId,
            locationId: line.locationId,
            lotNumber: line.lotNumber ?? null
          }
        })
        if (stock) {
          await tx.stockItem.update({ where: { id: stock.id }, data: { quantity: { increment: line.quantity } } })
        } else {
          await tx.stockItem.create({
            data: {
              tenantId: request.user.tenantId,
              productId: line.productId,
              locationId: line.locationId,
              quantity: line.quantity,
              lotNumber: line.lotNumber ?? null
            }
          })
        }
        await tx.stockMovement.create({
          data: {
            tenantId: request.user.tenantId,
            productId: line.productId,
            movementType: 'IN',
            quantity: line.quantity,
            toLocationId: line.locationId,
            referenceType: 'SALE_REFUND',
            referenceId: sale.id,
            note: `Сторно продажба: ${sale.saleNo}`,
            createdBy: request.user.id
          }
        })
      }
      await tx.sale.update({ where: { id: sale.id }, data: { status: 'REFUNDED' } })
    })
    const refunded = await prisma.sale.findUnique({ where: { id: sale.id } })
    return createSuccessResponse(refunded)
  })
}

export default salesRoute
