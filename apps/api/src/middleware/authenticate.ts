import 'fastify'
import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string
      email: string
      role: string
      tenantId: string
    }
    user: {
      id: string
      email: string
      role: string
      tenantId: string
    }
  }
}

export const authenticate = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    const payload = await request.jwtVerify<{
      id: string
      email: string
      role: string
      tenantId: string
    }>()

    request.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId
    }
  } catch {
    await reply.unauthorized('Invalid or expired token')
  }
}

type _EnsureFastifyInstanceImport = FastifyInstance

