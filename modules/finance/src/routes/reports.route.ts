import { createSuccessResponse, authenticate, requireRole, requireTenantModule } from '@dflow/core'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { getBalanceSheet, getIncomeStatement, getTrialBalance } from '../services/reports.service'

const financeGuards = [authenticate, requireRole('SUPER_ADMIN', 'MANAGER'), requireTenantModule('finance')]

const reportsRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/reports/trial-balance', { preHandler: financeGuards, schema: { tags: ['FINANCE'] } }, async (request) => {
    const query = request.query as { year?: string; month?: string }
    const year = query.year ? Number(query.year) : undefined
    const month = query.month ? Number(query.month) : undefined
    const data = await getTrialBalance(request.user.tenantId, year, month)
    return createSuccessResponse(data)
  })

  fastify.get('/reports/income-statement', { preHandler: financeGuards, schema: { tags: ['FINANCE'] } }, async (request) => {
    const query = request.query as { year?: string; month?: string }
    const year = query.year ? Number(query.year) : undefined
    const month = query.month ? Number(query.month) : undefined
    const data = await getIncomeStatement(request.user.tenantId, year, month)
    return createSuccessResponse(data)
  })

  fastify.get('/reports/balance-sheet', { preHandler: financeGuards, schema: { tags: ['FINANCE'] } }, async (request) => {
    const query = request.query as { date?: string }
    const data = await getBalanceSheet(request.user.tenantId, query.date)
    return createSuccessResponse(data)
  })
}

export default reportsRoute
