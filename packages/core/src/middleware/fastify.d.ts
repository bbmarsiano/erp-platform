import 'fastify'
import type { JwtPayload } from './authenticate'

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload
    authMethod?: 'jwt' | 'api_key'
    apiKeyScopes?: string[]
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}
