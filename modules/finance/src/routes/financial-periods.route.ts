import { createErrorResponse, createSuccessResponse, authenticate, requireRole, requireTenantModule } from '@dflow/core'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import {
  closeFinancialPeriod,
  DraftInvoicesInPeriodError,
  listFinancialPeriods,
  PeriodAlreadyClosedError,
  PeriodNotFoundError,
  reopenFinancialPeriod
} from '../services/period.service'

const financeGuards = [authenticate, requireRole('SUPER_ADMIN', 'MANAGER'), requireTenantModule('finance')]
const superAdminGuards = [authenticate, requireRole('SUPER_ADMIN'), requireTenantModule('finance')]

function parseYearMonth(params: { year: string; month: string }) {
  const year = Number(params.year)
  const month = Number(params.month)
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null
  }
  return { year, month }
}

const financialPeriodsRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/periods', { preHandler: financeGuards, schema: { tags: ['FINANCE'] } }, async (request) => {
    const periods = await listFinancialPeriods(request.user.tenantId)
    return createSuccessResponse(periods)
  })

  fastify.post('/periods/:year/:month/close', { preHandler: financeGuards }, async (request, reply) => {
    const parsed = parseYearMonth(request.params as { year: string; month: string })
    if (!parsed) {
      return reply.status(400).send(createErrorResponse('Invalid period', 'VALIDATION_ERROR', 400))
    }

    try {
      const updated = await closeFinancialPeriod(
        request.user.tenantId,
        parsed.year,
        parsed.month,
        request.user.id
      )
      const periods = await listFinancialPeriods(request.user.tenantId)
      const serialized = periods.find((p) => p.year === parsed.year && p.month === parsed.month) ?? {
        ...updated,
        periodLabel: `${parsed.month}/${parsed.year}`,
        closedByName: null,
        isCurrent: false
      }
      return createSuccessResponse(serialized)
    } catch (error) {
      if (error instanceof PeriodAlreadyClosedError) {
        return reply.status(400).send(createErrorResponse(error.userMessage, 'PERIOD_ALREADY_CLOSED', 400))
      }
      if (error instanceof DraftInvoicesInPeriodError) {
        return reply.status(400).send(createErrorResponse(error.userMessage, 'DRAFT_INVOICES_IN_PERIOD', 400))
      }
      throw error
    }
  })

  fastify.post('/periods/:year/:month/reopen', { preHandler: superAdminGuards }, async (request, reply) => {
    const parsed = parseYearMonth(request.params as { year: string; month: string })
    if (!parsed) {
      return reply.status(400).send(createErrorResponse('Invalid period', 'VALIDATION_ERROR', 400))
    }

    try {
      await reopenFinancialPeriod(request.user.tenantId, parsed.year, parsed.month)
      const periods = await listFinancialPeriods(request.user.tenantId)
      const serialized = periods.find((p) => p.year === parsed.year && p.month === parsed.month)
      if (!serialized) {
        return reply.status(404).send(createErrorResponse('Period not found', 'PERIOD_NOT_FOUND', 404))
      }
      return createSuccessResponse(serialized)
    } catch (error) {
      if (error instanceof PeriodNotFoundError) {
        return reply.status(404).send(createErrorResponse('Period not found', 'PERIOD_NOT_FOUND', 404))
      }
      throw error
    }
  })
}

export default financialPeriodsRoute
