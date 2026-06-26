import { createErrorResponse, createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../../../apps/api/src/middleware/authenticate'

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
    if (targetType === 'LOCAL' && !body.targetPath?.trim()) {
      return reply.status(400).send(
        createErrorResponse('Пътят е задължителен при LOCAL архивиране', 'TARGET_PATH_REQUIRED', 400)
      )
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
    const updated = await prisma.backupPolicy.updateMany({
      where: { id: params.id, tenantId: request.user.tenantId },
      data: body
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
    const job = await prisma.backupJob.create({
      data: {
        tenantId: request.user.tenantId,
        policyId: policy.id,
        status: 'PENDING'
      }
    })
    return createSuccessResponse(job)
  })
}

export default policiesRoute

