import type { FastifyRequest, FastifyReply } from 'fastify'

export const authenticate = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    const payload = await (request as FastifyRequest & { jwtVerify: () => Promise<{
      id: string
      email: string
      role: string
      tenantId: string
    }> }).jwtVerify()

    request.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId
    }
  } catch {
    return reply.status(401).send({ success: false, error: 'Invalid or expired token' })
  }
}
