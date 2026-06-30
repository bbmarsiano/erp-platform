import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import chartOfAccountsRoute from './src/routes/chart-of-accounts.route'
import customersRoute from './src/routes/customers.route'

const financePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(customersRoute, { prefix: '/api/finance' })
  await fastify.register(chartOfAccountsRoute, { prefix: '/api/finance' })
}

export default financePlugin
export { financeManifest } from './manifest'
