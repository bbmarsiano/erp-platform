import { createErrorResponse, createSuccessResponse, authenticate, requireRole, requireTenantModule } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { serializeJournalEntry } from '../utils/serialize-decimal'

const financeGuards = [authenticate, requireRole('SUPER_ADMIN', 'MANAGER'), requireTenantModule('finance')]

const journalInclude = {
  lines: {
    include: {
      account: { select: { id: true, code: true, name: true, accountType: true } }
    }
  }
}

const journalEntriesRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/journal-entries', { preHandler: financeGuards, schema: { tags: ['FINANCE'] } }, async (request) => {
    const query = request.query as { sourceType?: string; from?: string; to?: string }

    const rows = await prisma.journalEntry.findMany({
      where: {
        tenantId: request.user.tenantId,
        ...(query.sourceType ? { sourceType: query.sourceType } : {}),
        ...(query.from || query.to
          ? {
              entryDate: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lte: new Date(query.to) } : {})
              }
            }
          : {})
      },
      include: journalInclude,
      orderBy: { entryDate: 'desc' }
    })

    return createSuccessResponse(rows.map(serializeJournalEntry))
  })

  fastify.get('/journal-entries/:id', { preHandler: financeGuards }, async (request, reply) => {
    const params = request.params as { id: string }
    const entry = await prisma.journalEntry.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: journalInclude
    })
    if (!entry) {
      return reply.status(404).send(createErrorResponse('Journal entry not found', 'JOURNAL_ENTRY_NOT_FOUND', 404))
    }
    return createSuccessResponse(serializeJournalEntry(entry))
  })
}

export default journalEntriesRoute
