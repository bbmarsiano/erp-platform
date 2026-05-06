import cors from '@fastify/cors'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'

const corsPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(cors, {
    origin: true,
    credentials: true
  })
}

export default corsPlugin
