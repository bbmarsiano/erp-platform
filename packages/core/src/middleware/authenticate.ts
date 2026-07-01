import type { FastifyRequest, FastifyReply } from 'fastify'

export interface JwtPayload {
  id: string
  email: string
  role: string
  tenantId: string
}

type JwtVerifyRequest = FastifyRequest & {
  jwtVerify: () => Promise<unknown>
}

export const authenticate = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    const decoded = (await (request as JwtVerifyRequest).jwtVerify()) as JwtPayload

    request.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId
    }
  } catch {
    return reply.status(401).send({ success: false, error: 'Invalid or expired token' })
  }
}
