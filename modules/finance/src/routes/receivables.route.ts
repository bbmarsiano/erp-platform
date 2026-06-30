import { createErrorResponse, createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import { Decimal } from '@prisma/client/runtime/library'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../../../apps/api/src/middleware/authenticate'
import { requireRole } from '../../../../apps/api/src/middleware/requireRole'
import { requireTenantModule } from '../../../../apps/api/src/middleware/requireTenantModule'
import { computePaymentStatus, computeReceivableStatus } from '../services/receivable-status.service'
import { serializeReceivable } from '../utils/serialize-decimal'

const financeGuards = [authenticate, requireRole('SUPER_ADMIN', 'MANAGER'), requireTenantModule('finance')]

const receivablesRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/receivables', { preHandler: financeGuards, schema: { tags: ['FINANCE'] } }, async (request) => {
    const query = request.query as { status?: string }
    const rows = await prisma.receivable.findMany({
      where: {
        tenantId: request.user.tenantId,
        ...(query.status ? { status: query.status } : {})
      },
      include: {
        customer: true,
        invoice: { select: { id: true, number: true, docType: true, status: true, issueDate: true, totalAmount: true } }
      },
      orderBy: { dueDate: 'asc' }
    })

    return createSuccessResponse(
      rows.map((r) => ({
        ...serializeReceivable(r),
        status: computeReceivableStatus(r.amountDue, r.amountPaid, r.dueDate, r.status)
      }))
    )
  })

  fastify.post('/receivables/:id/payment', { preHandler: financeGuards }, async (request, reply) => {
    const params = request.params as { id: string }
    const body = request.body as { amount: number; paymentDate?: string; note?: string }

    if (!body.amount || body.amount <= 0) {
      return reply.status(400).send(createErrorResponse('Invalid payment amount', 'INVALID_AMOUNT', 400))
    }

    const receivable = await prisma.receivable.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: { invoice: true, customer: true }
    })
    if (!receivable) {
      return reply.status(404).send(createErrorResponse('Receivable not found', 'RECEIVABLE_NOT_FOUND', 404))
    }

    const newPaid = new Decimal(receivable.amountPaid).add(body.amount)
    const status = computePaymentStatus(receivable.amountDue, newPaid)

    const updated = await prisma.$transaction(async (tx) => {
      const rec = await tx.receivable.update({
        where: { id: receivable.id },
        data: { amountPaid: newPaid, status },
        include: { customer: true, invoice: true }
      })

      if (status === 'PAID') {
        await tx.invoice.update({
          where: { id: receivable.invoiceId },
          data: { status: 'PAID' }
        })
      } else if (status === 'PARTIALLY_PAID') {
        await tx.invoice.update({
          where: { id: receivable.invoiceId },
          data: { status: 'PARTIALLY_PAID' }
        })
      }

      if (body.note) {
        await tx.invoice.update({
          where: { id: receivable.invoiceId },
          data: {
            note: receivable.invoice.note
              ? `${receivable.invoice.note}\nПлащане ${body.amount} на ${new Date(body.paymentDate ?? Date.now()).toLocaleDateString('bg-BG')}: ${body.note}`
              : `Плащане ${body.amount}: ${body.note}`
          }
        })
      }

      return rec
    })

    return createSuccessResponse({
      ...serializeReceivable(updated),
      status: computeReceivableStatus(updated.amountDue, updated.amountPaid, updated.dueDate, updated.status)
    })
  })
}

export default receivablesRoute
