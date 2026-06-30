import type { FastifyRequest, FastifyReply } from 'fastify'
import { createErrorResponse } from '@dflow/core'

export const requireRole =
  (...roles: string[]) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const role = request.user?.role
    if (!role || !roles.includes(role)) {
      return reply
        .status(403)
        .send(createErrorResponse('Нямате права за тази операция', 'FORBIDDEN', 403))
    }
  }
