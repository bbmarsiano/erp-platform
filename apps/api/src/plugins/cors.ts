import cors from '@fastify/cors'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'

const corsPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(cors, {
    origin: 'http://localhost:5173',
    credentials: false
  })

  fastify.addHook('onSend', async (request, reply) => {
    if (request.headers.origin === 'http://localhost:5173') {
      reply.header('Access-Control-Allow-Origin', 'http://localhost:5173')
    }
  })
}

export default corsPlugin
