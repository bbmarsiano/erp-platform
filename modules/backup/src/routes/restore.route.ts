import { createErrorResponse, createSuccessResponse, authenticate } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import {
  formatRestoreTestNote,
  runRestoreTest
} from '../services/restore-runner.service'
import { serializeBackupJob, serializeBackupJobs } from '../utils/serialize-job'

const restoreRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/restore/points', { preHandler: [authenticate], schema: { tags: ['BACKUP'] } }, async (request) => {
    const data = await prisma.backupJob.findMany({
      where: { tenantId: request.user.tenantId, OR: [{ status: 'COMPLETED' }, { status: 'VERIFIED' }] },
      include: { policy: true },
      orderBy: { createdAt: 'desc' }
    })
    return createSuccessResponse(serializeBackupJobs(data))
  })

  fastify.post('/restore/test', { preHandler: [authenticate] }, async (request, reply) => {
    const body = request.body as { jobId: string; note?: string }
    const source = await prisma.backupJob.findFirst({
      where: { id: body.jobId, tenantId: request.user.tenantId },
      include: { policy: true }
    })
    if (!source) {
      return reply.status(404).send(createErrorResponse('Backup job not found', 'JOB_NOT_FOUND', 404))
    }
    if (!source.filePath) {
      return reply
        .status(400)
        .send(createErrorResponse('Архивният файл липсва за тази задача', 'BACKUP_FILE_MISSING', 400))
    }

    const result = await runRestoreTest(source.id)
    if (!result.success) {
      return reply
        .status(400)
        .send(createErrorResponse(result.errorMessage ?? 'Тест на възстановяване: неуспешен.', 'RESTORE_TEST_FAILED', 400))
    }

    const note = body.note ?? formatRestoreTestNote(result)
    const created = await prisma.backupJob.create({
      data: {
        tenantId: request.user.tenantId,
        policyId: source.policyId,
        status: 'VERIFIED',
        isVerified: true,
        completedAt: new Date(),
        note
      }
    })
    return createSuccessResponse(serializeBackupJob(created))
  })
}

export default restoreRoute
