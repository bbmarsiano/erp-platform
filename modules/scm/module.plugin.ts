import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { scmManifest } from './manifest'
import deliveriesRoute from './src/routes/deliveries.route'
import purchaseOrdersRoute from './src/routes/purchase-orders.route'
import reportsRoute from './src/routes/reports.route'
import suppliersRoute from './src/routes/suppliers.route'

const scmPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(suppliersRoute, { prefix: '/api/scm' })
  await fastify.register(purchaseOrdersRoute, { prefix: '/api/scm' })
  await fastify.register(deliveriesRoute, { prefix: '/api/scm' })
  await fastify.register(reportsRoute, { prefix: '/api/scm' })
}

export default scmPlugin
export { scmManifest }

