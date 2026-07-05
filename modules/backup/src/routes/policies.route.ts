import { createErrorResponse, createSuccessResponse, authenticate } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { validateBackupTargetPathForPolicy } from '../services/backup-path.service'
import { scheduleBackupJob } from '../services/backup-runner.service'
import { serializeBackupJob } from '../utils/serialize-job'

async function validateLocalTargetPath(targetType: 'LOCAL' | 'NETWORK' | 'S3', targetPath?: string | null) {
  if (targetType !== 'LOCAL') return
  await validateBackupTargetPathForPolicy(targetPath)
}

const policiesRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/policies', { preHandler: [authenticate], schema: { tags: ['BACKUP'] } }, async (request) => {
    const data = await prisma.backupPolicy.findMany({
      where: { tenantId: request.user.tenantId },
      orderBy: { createdAt: 'desc' }
    })
    return createSuccessResponse(data)
  })

  fastify.post('/policies', { preHandler: [authenticate] }, async (request, reply) => {
    const body = request.body as {
      name: string
      schedule: string
      retentionDays?: number
      targetType?: 'LOCAL' | 'NETWORK' | 'S3'
      targetPath?: string
      isActive?: boolean
      isEncrypted?: boolean
    }
    const targetType = body.targetType ?? 'LOCAL'

    try {
      await validateLocalTargetPath(targetType, body.targetPath?.trim() || null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Невалиден път за архивиране'
      return reply.status(400).send(createErrorResponse(message, 'BACKUP_TARGET_PATH_INVALID', 400))
    }

    const created = await prisma.backupPolicy.create({
      data: {
        tenantId: request.user.tenantId,
        name: body.name,
        schedule: body.schedule,
        retentionDays: body.retentionDays ?? 30,
        targetType,
        targetPath: body.targetPath?.trim() || null,
        isActive: body.isActive ?? true,
        isEncrypted: body.isEncrypted ?? true
      }
    })
    return createSuccessResponse(created)
  })

  fastify.put('/policies/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const body = request.body as Partial<{
      name: string
      schedule: string
      retentionDays: number
      targetType: 'LOCAL' | 'NETWORK' | 'S3'
      targetPath: string
      isActive: boolean
      isEncrypted: boolean
    }>

    const existing = await prisma.backupPolicy.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId }
    })
    if (!existing) {
      return reply.status(404).send(createErrorResponse('Policy not found', 'POLICY_NOT_FOUND', 404))
    }

    const targetType = body.targetType ?? existing.targetType
    const targetPath =
      body.targetPath !== undefined ? body.targetPath.trim() || null : existing.targetPath

    if (body.targetPath !== undefined || body.targetType !== undefined) {
      try {
        await validateLocalTargetPath(targetType, targetPath)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Невалиден път за архивиране'
        return reply.status(400).send(createErrorResponse(message, 'BACKUP_TARGET_PATH_INVALID', 400))
      }
    }

    const updated = await prisma.backupPolicy.updateMany({
      where: { id: params.id, tenantId: request.user.tenantId },
      data: {
        ...body,
        ...(body.targetPath !== undefined ? { targetPath } : {})
      }
    })
    if (!updated.count) return reply.status(404).send(createErrorResponse('Policy not found', 'POLICY_NOT_FOUND', 404))
    return createSuccessResponse({ updated: true })
  })

  fastify.delete('/policies/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const updated = await prisma.backupPolicy.updateMany({
      where: { id: params.id, tenantId: request.user.tenantId },
      data: { isActive: false }
    })
    if (!updated.count) return reply.status(404).send(createErrorResponse('Policy not found', 'POLICY_NOT_FOUND', 404))
    return createSuccessResponse({ deactivated: true })
  })

  fastify.post('/policies/:id/run', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const policy = await prisma.backupPolicy.findFirst({ where: { id: params.id, tenantId: request.user.tenantId } })
    if (!policy) return reply.status(404).send(createErrorResponse('Policy not found', 'POLICY_NOT_FOUND', 404))
    const startedAt = new Date()
    const job = await prisma.backupJob.create({
      data: {
        tenantId: request.user.tenantId,
        policyId: policy.id,
        status: 'PENDING',
        startedAt
      }
    })
    scheduleBackupJob(job.id, policy.targetPath)
    return createSuccessResponse(serializeBackupJob(job))
  })
}

export default policiesRoute

