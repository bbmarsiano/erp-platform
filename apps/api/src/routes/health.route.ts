import type { FastifyInstance, FastifyPluginAsync } from 'fastify'

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
                  loadedModules: { type: 'array', items: { type: 'string' } },
                  skippedModules: { type: 'array', items: { type: 'string' } },
                  licensedFeatures: { type: 'array', items: { type: 'string' } }
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
          version: '0.7.1',
          timestamp: new Date().toISOString(),
          loadedModules: fastify.loadedModules,
          skippedModules: fastify.skippedModules,
          licensedFeatures: fastify.licensedFeatures
        }
      })
    }
  )
}

export default healthRoute
