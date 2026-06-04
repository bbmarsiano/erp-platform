import cors from '@fastify/cors'
import fp from 'fastify-plugin/plugin.js'
import type { FastifyPluginAsync } from 'fastify'

const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

}

export default fp(corsPlugin)
