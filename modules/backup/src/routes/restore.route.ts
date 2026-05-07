import { createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../../../apps/api/src/middleware/authenticate'

const restoreRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/restore/points', { preHandler: [authenticate], schema: { tags: ['BACKUP'] } }, async (request) => {
    const data = await prisma.backupJob.findMany({
      where: { tenantId: request.user.tenantId, OR: [{ status: 'COMPLETED' }, { status: 'VERIFIED' }] },
      include: { policy: true },
      orderBy: { createdAt: 'desc' }
    })
    return createSuccessResponse(data)
  })

  fastify.post('/restore/test', { preHandler: [authenticate] }, async (request) => {
    const body = request.body as { jobId: string; note?: string }
    const source = await prisma.backupJob.findFirst({
      where: { id: body.jobId, tenantId: request.user.tenantId },
      include: { policy: true }
    })
    const created = await prisma.backupJob.create({
      data: {
        tenantId: request.user.tenantId,
        policyId: source?.policyId,
        status: 'VERIFIED',
        isVerified: true,
        completedAt: new Date(),
        note: body.note ?? `Test restore from ${body.jobId}`
      }
    })
    return createSuccessResponse(created)
  })
}

export default restoreRoute

