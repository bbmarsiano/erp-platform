import { createErrorResponse, createSuccessResponse, authenticate, requireRole, requireTenantModule } from '@dflow/core'
import { prisma } from '@dflow/db'
import { Decimal } from '@prisma/client/runtime/library'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { computePaymentStatus, computeReceivableStatus } from '../services/receivable-status.service'
import { serializePayable } from '../utils/serialize-decimal'

const financeGuards = [authenticate, requireRole('SUPER_ADMIN', 'MANAGER'), requireTenantModule('finance')]

const payablesRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/payables', { preHandler: financeGuards, schema: { tags: ['FINANCE'] } }, async (request) => {
    const query = request.query as { status?: string }
    const rows = await prisma.payable.findMany({
      where: {
        tenantId: request.user.tenantId,
        ...(query.status ? { status: query.status } : {})
      },
      include: {
        supplier: true,
        invoice: { select: { id: true, number: true, docType: true, status: true, issueDate: true, totalAmount: true } }
      },
      orderBy: { dueDate: 'asc' }
    })

    return createSuccessResponse(
      rows.map((p) => ({
        ...serializePayable(p),
        status: computeReceivableStatus(p.amountDue, p.amountPaid, p.dueDate, p.status)
      }))
    )
  })

  fastify.post('/payables/:id/payment', { preHandler: financeGuards }, async (request, reply) => {
    const params = request.params as { id: string }
    const body = request.body as { amount: number; paymentDate?: string; note?: string }

    if (!body.amount || body.amount <= 0) {
      return reply.status(400).send(createErrorResponse('Invalid payment amount', 'INVALID_AMOUNT', 400))
    }

    const payable = await prisma.payable.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: { invoice: true, supplier: true }
    })
    if (!payable) return reply.status(404).send(createErrorResponse('Payable not found', 'PAYABLE_NOT_FOUND', 404))

    const newPaid = new Decimal(payable.amountPaid).add(body.amount)
    const status = computePaymentStatus(payable.amountDue, newPaid)

    const updated = await prisma.$transaction(async (tx) => {
      const pay = await tx.payable.update({
        where: { id: payable.id },
        data: { amountPaid: newPaid, status },
        include: { supplier: true, invoice: true }
      })

      if (status === 'PAID') {
        await tx.invoice.update({ where: { id: payable.invoiceId }, data: { status: 'PAID' } })
      } else if (status === 'PARTIALLY_PAID') {
        await tx.invoice.update({ where: { id: payable.invoiceId }, data: { status: 'PARTIALLY_PAID' } })
      }

      return pay
    })

    return createSuccessResponse({
      ...serializePayable(updated),
      status: computeReceivableStatus(updated.amountDue, updated.amountPaid, updated.dueDate, updated.status)
    })
  })
}

export default payablesRoute
