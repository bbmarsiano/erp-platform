import { createErrorResponse, createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../../../apps/api/src/middleware/authenticate'
import { requireRole } from '../../../../apps/api/src/middleware/requireRole'
import { requireTenantModule } from '../../../../apps/api/src/middleware/requireTenantModule'
import {
  buildAccountTree,
  groupAccountsByType,
  listChartOfAccounts
} from '../services/chart-of-accounts.service'
import type { ChartOfAccountInput } from '../types/finance.types'

const financeGuards = [authenticate, requireRole('SUPER_ADMIN', 'MANAGER'), requireTenantModule('finance')]

const chartOfAccountsRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get(
    '/chart-of-accounts',
    { preHandler: financeGuards, schema: { tags: ['FINANCE'] } },
    async (request) => {
      const accounts = await listChartOfAccounts(request.user.tenantId)
      const tree = buildAccountTree(accounts)
      const grouped = groupAccountsByType(tree)
      return createSuccessResponse({ tree, grouped, flat: accounts })
    }
  )

  fastify.post('/chart-of-accounts', { preHandler: financeGuards }, async (request, reply) => {
    const body = request.body as ChartOfAccountInput
    if (body.parentId) {
      const parent = await prisma.chartOfAccount.findFirst({
        where: { id: body.parentId, tenantId: request.user.tenantId }
      })
      if (!parent) {
        return reply.status(400).send(createErrorResponse('Parent account not found', 'PARENT_NOT_FOUND', 400))
      }
    }

    const created = await prisma.chartOfAccount.create({
      data: {
        tenantId: request.user.tenantId,
        code: body.code,
        name: body.name,
        accountType: body.accountType,
        parentId: body.parentId ?? null,
        isActive: true
      }
    })
    return createSuccessResponse(created)
  })
}

export default chartOfAccountsRoute
