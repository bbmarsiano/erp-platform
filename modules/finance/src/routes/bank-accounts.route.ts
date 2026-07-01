import { createErrorResponse, createSuccessResponse, authenticate, requireRole, requireTenantModule } from '@dflow/core'
import { prisma } from '@dflow/db'
import { Decimal } from '@prisma/client/runtime/library'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { serializeBankAccount } from '../utils/serialize-decimal'

const financeGuards = [authenticate, requireRole('SUPER_ADMIN', 'MANAGER'), requireTenantModule('finance')]

const bankAccountsRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/bank-accounts', { preHandler: financeGuards, schema: { tags: ['FINANCE'] } }, async (request) => {
    const accounts = await prisma.bankAccount.findMany({
      where: { tenantId: request.user.tenantId },
      orderBy: { name: 'asc' }
    })

    const balances = await prisma.bankTransaction.groupBy({
      by: ['bankAccountId'],
      where: { tenantId: request.user.tenantId },
      _sum: { amount: true }
    })
    const balanceMap = new Map(balances.map((b) => [b.bankAccountId, Number(b._sum.amount ?? 0)]))

    return createSuccessResponse(
      accounts.map((a) => ({
        ...serializeBankAccount(a),
        balance: balanceMap.get(a.id) ?? 0
      }))
    )
  })

  fastify.post('/bank-accounts', { preHandler: financeGuards }, async (request, reply) => {
    const body = request.body as {
      name: string
      iban: string
      currency?: string
      bankName?: string
    }
    if (!body.name?.trim() || !body.iban?.trim()) {
      return reply.status(400).send(createErrorResponse('Name and IBAN are required', 'VALIDATION_ERROR', 400))
    }

    try {
      const created = await prisma.bankAccount.create({
        data: {
          tenantId: request.user.tenantId,
          name: body.name.trim(),
          iban: body.iban.trim().toUpperCase(),
          currency: body.currency ?? 'BGN',
          bankName: body.bankName?.trim() || null
        }
      })
      return createSuccessResponse({ ...serializeBankAccount(created), balance: 0 })
    } catch {
      return reply.status(400).send(createErrorResponse('IBAN вече съществува за този tenant', 'DUPLICATE_IBAN', 400))
    }
  })

  fastify.put('/bank-accounts/:id', { preHandler: financeGuards }, async (request, reply) => {
    const params = request.params as { id: string }
    const body = request.body as { name?: string; bankName?: string; isActive?: boolean }

    const updated = await prisma.bankAccount.updateMany({
      where: { id: params.id, tenantId: request.user.tenantId },
      data: {
        name: body.name?.trim(),
        bankName: body.bankName !== undefined ? body.bankName?.trim() || null : undefined,
        isActive: body.isActive
      }
    })
    if (!updated.count) {
      return reply.status(404).send(createErrorResponse('Bank account not found', 'BANK_ACCOUNT_NOT_FOUND', 404))
    }

    const account = await prisma.bankAccount.findFirst({ where: { id: params.id, tenantId: request.user.tenantId } })
    const sum = await prisma.bankTransaction.aggregate({
      where: { bankAccountId: params.id, tenantId: request.user.tenantId },
      _sum: { amount: true }
    })
    return createSuccessResponse({
      ...serializeBankAccount(account!),
      balance: Number(sum._sum.amount ?? 0)
    })
  })

  fastify.delete('/bank-accounts/:id', { preHandler: financeGuards }, async (request, reply) => {
    const params = request.params as { id: string }
    const updated = await prisma.bankAccount.updateMany({
      where: { id: params.id, tenantId: request.user.tenantId },
      data: { isActive: false }
    })
    if (!updated.count) {
      return reply.status(404).send(createErrorResponse('Bank account not found', 'BANK_ACCOUNT_NOT_FOUND', 404))
    }
    const account = await prisma.bankAccount.findFirst({ where: { id: params.id, tenantId: request.user.tenantId } })
    return createSuccessResponse(serializeBankAccount(account!))
  })
}

export default bankAccountsRoute
