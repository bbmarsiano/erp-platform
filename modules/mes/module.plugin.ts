import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { mesManifest } from './manifest'
import productsBomRoute from './src/routes/products-bom.route'
import reportsRoute from './src/routes/reports.route'
import workOrdersRoute from './src/routes/work-orders.route'

const mesPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(productsBomRoute, { prefix: '/api/mes' })
  await fastify.register(workOrdersRoute, { prefix: '/api/mes' })
  await fastify.register(reportsRoute, { prefix: '/api/mes' })
}

export default mesPlugin
export { mesManifest }

