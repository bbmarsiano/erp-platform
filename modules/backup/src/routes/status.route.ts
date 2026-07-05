import { createSuccessResponse, authenticate } from '@dflow/core'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { getBackupAgentStatus } from '../services/backup-runner.service'

const statusRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/status', { preHandler: [authenticate], schema: { tags: ['BACKUP'] } }, async () => {
    const status = await getBackupAgentStatus()
    return createSuccessResponse(status)
  })
}

export default statusRoute
