import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import bankAccountsRoute from './src/routes/bank-accounts.route'
import bankTransactionsRoute from './src/routes/bank-transactions.route'
import chartOfAccountsRoute from './src/routes/chart-of-accounts.route'
import financialPeriodsRoute from './src/routes/financial-periods.route'
import customersRoute from './src/routes/customers.route'
import invoicesRoute from './src/routes/invoices.route'
import journalEntriesRoute from './src/routes/journal-entries.route'
import payablesRoute from './src/routes/payables.route'
import receivablesRoute from './src/routes/receivables.route'
import reportsRoute from './src/routes/reports.route'

const financePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(customersRoute, { prefix: '/api/finance' })
  await fastify.register(chartOfAccountsRoute, { prefix: '/api/finance' })
  await fastify.register(invoicesRoute, { prefix: '/api/finance' })
  await fastify.register(receivablesRoute, { prefix: '/api/finance' })
  await fastify.register(payablesRoute, { prefix: '/api/finance' })
  await fastify.register(journalEntriesRoute, { prefix: '/api/finance' })
  await fastify.register(bankAccountsRoute, { prefix: '/api/finance' })
  await fastify.register(bankTransactionsRoute, { prefix: '/api/finance' })
  await fastify.register(reportsRoute, { prefix: '/api/finance' })
  await fastify.register(financialPeriodsRoute, { prefix: '/api/finance' })
}

export default financePlugin
export { financeManifest } from './manifest'
