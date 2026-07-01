import 'fastify'
import type { JwtPayload } from './authenticate'

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}
