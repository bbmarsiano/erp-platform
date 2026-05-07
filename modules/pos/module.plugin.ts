import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { posManifest } from './manifest'
import cashRegisterRoute from './src/routes/cash-register.route'
import reportsRoute from './src/routes/reports.route'
import salesRoute from './src/routes/sales.route'

const posPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(cashRegisterRoute, { prefix: '/api/pos' })
  await fastify.register(salesRoute, { prefix: '/api/pos' })
  await fastify.register(reportsRoute, { prefix: '/api/pos' })
}

export default posPlugin
export { posManifest }

