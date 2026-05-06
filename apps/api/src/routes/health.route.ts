import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { loadedModules } from '../plugins/moduleLoader'

const healthRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get(
    '/health',
    {
      schema: {
        tags: ['System'],
        summary: 'Health check',
        description: 'Returns API status and loaded modules',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  version: { type: 'string' },
                  timestamp: { type: 'string' },
                  loadedModules: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        }
      }
    },
    async (_request, reply) => {
      return reply.send({
        success: true,
        data: {
          status: 'ok',
          version: '0.1.0',
          timestamp: new Date().toISOString(),
          loadedModules: loadedModules.map((module) => module.id)
        }
      })
    }
  )
}

export default healthRoute
