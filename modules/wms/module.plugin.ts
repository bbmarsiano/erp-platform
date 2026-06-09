import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { wmsManifest } from './manifest'
import warehousesRoute from './src/routes/warehouses.route'
import locationsRoute from './src/routes/locations.route'
import stockRoute from './src/routes/stock.route'
import receiptsRoute from './src/routes/receipts.route'
import issuesRoute from './src/routes/issues.route'
import reportsRoute from './src/routes/reports.route'
import productsRoute from './src/routes/products.route'

const wmsPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(warehousesRoute, { prefix: '/api/wms' })
  await fastify.register(locationsRoute, { prefix: '/api/wms' })
  await fastify.register(stockRoute, { prefix: '/api/wms' })
  await fastify.register(receiptsRoute, { prefix: '/api/wms' })
  await fastify.register(issuesRoute, { prefix: '/api/wms' })
  await fastify.register(reportsRoute, { prefix: '/api/wms' })
  await fastify.register(productsRoute, { prefix: '/api/wms' })
}

export default wmsPlugin
export { wmsManifest }
