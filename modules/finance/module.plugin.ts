import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import chartOfAccountsRoute from './src/routes/chart-of-accounts.route'
import customersRoute from './src/routes/customers.route'
import invoicesRoute from './src/routes/invoices.route'
import payablesRoute from './src/routes/payables.route'
import receivablesRoute from './src/routes/receivables.route'

const financePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(customersRoute, { prefix: '/api/finance' })
  await fastify.register(chartOfAccountsRoute, { prefix: '/api/finance' })
  await fastify.register(invoicesRoute, { prefix: '/api/finance' })
  await fastify.register(receivablesRoute, { prefix: '/api/finance' })
  await fastify.register(payablesRoute, { prefix: '/api/finance' })
}

export default financePlugin
export { financeManifest } from './manifest'
