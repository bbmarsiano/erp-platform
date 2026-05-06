import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import fp from 'fastify-plugin/plugin.js'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const swaggerPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const packageJsonPath = join(__dirname, '../../../../package.json')
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8')) as { version: string }

  await fastify.register(swagger, {
    mode: 'dynamic',
    openapi: {
      info: {
        title: 'DFlowERP API',
        description: 'DFlowERP - Enterprise Resource Planning Platform',
        version: packageJson.version
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  })

  await fastify.register(swaggerUi, {
    routePrefix: '/docs'
  })
}

export default fp(swaggerPlugin)
