import { createErrorResponse, createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../../../apps/api/src/middleware/authenticate'
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
      paymentMethod?: 'CASH' | 'CARD' | 'MIXED'
      note?: string
      lines: Array<{ productId: string; locationId: string; quantity: number; unitPrice: number }>
    }
    if (!body.lines?.length) {
      return reply.status(400).send(createErrorResponse('At least one sale line is required', 'INVALID_LINES', 400))
    }
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const count = await prisma.sale.count({ where: { tenantId: request.user.tenantId, createdAt: { gte: dayStart } } })
    const saleNo = `SAL-${dateStr}-${String(count + 1).padStart(4, '0')}`

    const sale = await prisma.$transaction(async (tx) => {
      const totalAmount = body.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0)
      const createdSale = await tx.sale.create({
        data: {
          tenantId: request.user.tenantId,
          saleNo,
          cashRegisterId: body.cashRegisterId,
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
          throw new Error('Недостатъчна наличност')
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
      return tx.sale.findUnique({ where: { id: createdSale.id }, include: { lines: true } })
    })

    return createSuccessResponse(sale)
  })

  fastify.get('/sales/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const sale = await prisma.sale.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: { cashRegister: true, lines: { include: { product: true, location: true } } }
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
          where: { tenantId: request.user.tenantId, productId: line.productId, locationId: line.locationId, lotNumber: line.lotNumber ?? null }
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

