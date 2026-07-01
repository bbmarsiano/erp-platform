import { createErrorResponse, createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import { Decimal } from '@prisma/client/runtime/library'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../../../apps/api/src/middleware/authenticate'
import { requireRole } from '../../../../apps/api/src/middleware/requireRole'
import { requireTenantModule } from '../../../../apps/api/src/middleware/requireTenantModule'
import { getAccountByCode } from '../services/account.service'
import { createJournalEntry } from '../services/journal.service'
import { applyPayablePayment, applyReceivablePayment, PaymentError } from '../services/payment.service'
import { assertPeriodOpen, PeriodClosedError } from '../services/period.service'
import { computeReceivableStatus } from '../services/receivable-status.service'
import { serializeBankTransaction, serializePayable, serializeReceivable } from '../utils/serialize-decimal'

const financeGuards = [authenticate, requireRole('SUPER_ADMIN', 'MANAGER'), requireTenantModule('finance')]

const transactionInclude = {
  bankAccount: { select: { id: true, name: true, iban: true, currency: true, bankName: true } }
}

const bankTransactionsRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/bank-transactions', { preHandler: financeGuards, schema: { tags: ['FINANCE'] } }, async (request) => {
    const query = request.query as {
      bankAccountId?: string
      from?: string
      to?: string
      isReconciled?: string
      transactionType?: string
    }

    const rows = await prisma.bankTransaction.findMany({
      where: {
        tenantId: request.user.tenantId,
        ...(query.bankAccountId ? { bankAccountId: query.bankAccountId } : {}),
        ...(query.transactionType ? { transactionType: query.transactionType } : {}),
        ...(query.isReconciled !== undefined ? { isReconciled: query.isReconciled === 'true' } : {}),
        ...(query.from || query.to
          ? {
              transactionDate: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lte: new Date(query.to) } : {})
              }
            }
          : {})
      },
      include: transactionInclude,
      orderBy: { transactionDate: 'desc' }
    })

    return createSuccessResponse(rows.map(serializeBankTransaction))
  })

  fastify.post('/bank-transactions', { preHandler: financeGuards }, async (request, reply) => {
    const body = request.body as {
      bankAccountId: string
      transactionDate: string
      valueDate?: string
      amount: number
      description: string
      counterparty?: string
      referenceNumber?: string
      transactionType: 'IN' | 'OUT' | 'TRANSFER'
    }

    if (!body.bankAccountId || !body.description?.trim() || !body.amount || body.amount <= 0) {
      return reply.status(400).send(createErrorResponse('Invalid transaction data', 'VALIDATION_ERROR', 400))
    }

    const account = await prisma.bankAccount.findFirst({
      where: { id: body.bankAccountId, tenantId: request.user.tenantId, isActive: true }
    })
    if (!account) {
      return reply.status(404).send(createErrorResponse('Bank account not found', 'BANK_ACCOUNT_NOT_FOUND', 404))
    }

    const signedAmount =
      body.transactionType === 'OUT' ? new Decimal(-body.amount) : new Decimal(body.amount)

    const created = await prisma.bankTransaction.create({
      data: {
        tenantId: request.user.tenantId,
        bankAccountId: body.bankAccountId,
        transactionDate: new Date(body.transactionDate),
        valueDate: body.valueDate ? new Date(body.valueDate) : null,
        amount: signedAmount,
        description: body.description.trim(),
        counterparty: body.counterparty?.trim() || null,
        referenceNumber: body.referenceNumber?.trim() || null,
        transactionType: body.transactionType,
        createdBy: request.user.id
      },
      include: transactionInclude
    })

    return createSuccessResponse(serializeBankTransaction(created))
  })

  fastify.post('/bank-transactions/:id/reconcile', { preHandler: financeGuards }, async (request, reply) => {
    const params = request.params as { id: string }
    const body = request.body as { matchedType: 'RECEIVABLE' | 'PAYABLE'; matchedId: string }

    const transaction = await prisma.bankTransaction.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: transactionInclude
    })
    if (!transaction) {
      return reply.status(404).send(createErrorResponse('Transaction not found', 'TRANSACTION_NOT_FOUND', 404))
    }
    if (transaction.isReconciled) {
      return reply
        .status(400)
        .send(createErrorResponse('Транзакцията вече е съпоставена', 'ALREADY_RECONCILED', 400))
    }

    const amount = Number(transaction.amount)
    const paymentAmount = Math.abs(amount)

    if (amount > 0 && body.matchedType !== 'RECEIVABLE') {
      return reply
        .status(400)
        .send(createErrorResponse('Входяща транзакция може да се съпостави само с вземане', 'INVALID_MATCH_TYPE', 400))
    }
    if (amount < 0 && body.matchedType !== 'PAYABLE') {
      return reply
        .status(400)
        .send(createErrorResponse('Изходяща транзакция може да се съпостави само със задължение', 'INVALID_MATCH_TYPE', 400))
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        let matchedEntity: unknown

        if (body.matchedType === 'RECEIVABLE') {
          matchedEntity = await applyReceivablePayment(tx, {
            tenantId: request.user.tenantId,
            receivableId: body.matchedId,
            amount: paymentAmount,
            paymentDate: transaction.transactionDate,
            note: `Банково съпоставяне: ${transaction.description}`
          })
        } else {
          matchedEntity = await applyPayablePayment(tx, {
            tenantId: request.user.tenantId,
            payableId: body.matchedId,
            amount: paymentAmount,
            paymentDate: transaction.transactionDate,
            note: `Банково съпоставяне: ${transaction.description}`
          })
        }

        const acc503 = await getAccountByCode(tx, request.user.tenantId, '503')
        const acc411 = await getAccountByCode(tx, request.user.tenantId, '411')
        const acc401 = await getAccountByCode(tx, request.user.tenantId, '401')

        await assertPeriodOpen(request.user.tenantId, transaction.transactionDate, tx)

        if (amount > 0) {
          await createJournalEntry(tx, {
            tenantId: request.user.tenantId,
            entryDate: transaction.transactionDate,
            description: `Банково плащане — ${transaction.description}`,
            sourceType: 'MANUAL',
            sourceId: transaction.id,
            createdBy: request.user.id,
            lines: [
              { accountId: acc503.id, debit: paymentAmount, description: transaction.description },
              { accountId: acc411.id, credit: paymentAmount, description: transaction.description }
            ]
          })
        } else {
          await createJournalEntry(tx, {
            tenantId: request.user.tenantId,
            entryDate: transaction.transactionDate,
            description: `Банково плащане — ${transaction.description}`,
            sourceType: 'MANUAL',
            sourceId: transaction.id,
            createdBy: request.user.id,
            lines: [
              { accountId: acc401.id, debit: paymentAmount, description: transaction.description },
              { accountId: acc503.id, credit: paymentAmount, description: transaction.description }
            ]
          })
        }

        const updatedTx = await tx.bankTransaction.update({
          where: { id: transaction.id },
          data: {
            isReconciled: true,
            matchedType: body.matchedType,
            matchedId: body.matchedId
          },
          include: transactionInclude
        })

        return { transaction: updatedTx, matchedEntity }
      })

      const serialized = serializeBankTransaction(result.transaction)
      const matched =
        body.matchedType === 'RECEIVABLE'
          ? {
              ...serializeReceivable(result.matchedEntity as any),
              status: computeReceivableStatus(
                (result.matchedEntity as any).amountDue,
                (result.matchedEntity as any).amountPaid,
                (result.matchedEntity as any).dueDate,
                (result.matchedEntity as any).status
              )
            }
          : {
              ...serializePayable(result.matchedEntity as any),
              status: computeReceivableStatus(
                (result.matchedEntity as any).amountDue,
                (result.matchedEntity as any).amountPaid,
                (result.matchedEntity as any).dueDate,
                (result.matchedEntity as any).status
              )
            }

      return createSuccessResponse({ ...serialized, matched })
    } catch (error) {
      if (error instanceof PaymentError) {
        return reply.status(400).send(createErrorResponse(error.message, error.code, 400))
      }
      if (error instanceof PeriodClosedError) {
        return reply.status(400).send(createErrorResponse(error.userMessage, 'PERIOD_CLOSED', 400))
      }
      if (error instanceof Error && error.message.startsWith('MISSING_ACCOUNT:')) {
        const code = error.message.split(':')[1]
        return reply
          .status(400)
          .send(createErrorResponse(`Липсва сметка ${code} в сметкоплана`, 'MISSING_CHART_ACCOUNT', 400))
      }
      throw error
    }
  })
}

export default bankTransactionsRoute
