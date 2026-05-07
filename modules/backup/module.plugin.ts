import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { backupManifest } from './manifest'
import jobsRoute from './src/routes/jobs.route'
import policiesRoute from './src/routes/policies.route'
import restoreRoute from './src/routes/restore.route'

const backupPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(policiesRoute, { prefix: '/api/backup' })
  await fastify.register(jobsRoute, { prefix: '/api/backup' })
  await fastify.register(restoreRoute, { prefix: '/api/backup' })
}

export default backupPlugin
export { backupManifest }

