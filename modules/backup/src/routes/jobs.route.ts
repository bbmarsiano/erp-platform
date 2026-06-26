import { createErrorResponse, createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../../../apps/api/src/middleware/authenticate'
import { cleanupStaleBackupJobs } from '../services/stale-jobs.service'

const jobsRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post('/jobs/cleanup-stale', { preHandler: [authenticate], schema: { tags: ['BACKUP'] } }, async (request) => {
    const cleaned = await cleanupStaleBackupJobs(request.user.tenantId)
    return createSuccessResponse({ cleaned })
  })

  fastify.get('/jobs', { preHandler: [authenticate], schema: { tags: ['BACKUP'] } }, async (request) => {
    await cleanupStaleBackupJobs(request.user.tenantId)
    const query = request.query as { status?: string; policyId?: string }
    const data = await prisma.backupJob.findMany({
      where: {
        tenantId: request.user.tenantId,
        ...(query.status ? { status: query.status as any } : {}),
        ...(query.policyId ? { policyId: query.policyId } : {})
      },
      include: { policy: true },
      orderBy: { createdAt: 'desc' }
    })
    return createSuccessResponse(data)
  })

  fastify.get('/jobs/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const job = await prisma.backupJob.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: { policy: true }
    })
    if (!job) return reply.status(404).send(createErrorResponse('Backup job not found', 'JOB_NOT_FOUND', 404))
    return createSuccessResponse(job)
  })

  fastify.post('/jobs/:id/verify', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const updated = await prisma.backupJob.updateMany({
      where: { id: params.id, tenantId: request.user.tenantId },
      data: { status: 'VERIFIED', isVerified: true, completedAt: new Date() }
    })
    if (!updated.count) return reply.status(404).send(createErrorResponse('Backup job not found', 'JOB_NOT_FOUND', 404))
    return createSuccessResponse({ verified: true })
  })

  // internal endpoint used by Go backup daemon
  fastify.put('/jobs/:id/status', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const body = request.body as {
      status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'VERIFIED'
      sizeBytes?: number
      filePath?: string
      checksum?: string
      errorMsg?: string
    }
    const existing = await prisma.backupJob.findFirst({ where: { id: params.id, tenantId: request.user.tenantId } })
    if (!existing) return reply.status(404).send(createErrorResponse('Backup job not found', 'JOB_NOT_FOUND', 404))
    const updated = await prisma.backupJob.update({
      where: { id: existing.id },
      data: {
        status: body.status,
        startedAt: body.status === 'RUNNING' ? new Date() : existing.startedAt,
        completedAt: ['COMPLETED', 'FAILED', 'VERIFIED'].includes(body.status) ? new Date() : existing.completedAt,
        sizeBytes: body.sizeBytes !== undefined ? BigInt(body.sizeBytes) : existing.sizeBytes,
        filePath: body.filePath ?? existing.filePath,
        checksum: body.checksum ?? existing.checksum,
        errorMsg: body.errorMsg ?? existing.errorMsg,
        isVerified: body.status === 'VERIFIED' ? true : existing.isVerified
      }
    })
    return createSuccessResponse(updated)
  })
}

export default jobsRoute

