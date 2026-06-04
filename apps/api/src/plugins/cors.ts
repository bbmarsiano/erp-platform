import cors from '@fastify/cors'
import fp from 'fastify-plugin/plugin.js'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'

const corsPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow localhost on any port (for dev)
      // Allow no origin (curl, mobile apps, same-origin)
      if (!origin ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          origin.includes('vercel.app')) {
        cb(null, true)
      } else {
        cb(null, true) // In production, all origins allowed (VPN-protected)
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // Ensure CORS headers on actual responses (not just preflight)
  fastify.addHook('onSend', async (request, reply) => {
    const origin = request.headers.origin
    if (origin) {
      reply.header('Access-Control-Allow-Origin', origin)
      reply.header('Access-Control-Allow-Credentials', 'true')
    }
  })
}

export default fp(corsPlugin, { name: 'dflow-cors' })
