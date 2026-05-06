import jwt from '@fastify/jwt'
import fp from 'fastify-plugin/plugin.js'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'

type AuthJwtPayload = {
  id: string
  email: string
  role: string
  tenantId: string
}

const jwtPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'change-me',
    sign: {
      expiresIn: '15m'
    }
  })
}

export default fp(jwtPlugin)
