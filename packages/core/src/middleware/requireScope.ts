import type { FastifyRequest, FastifyReply } from 'fastify'
import { createErrorResponse } from '../utils/api.utils.js'

/** Enforces API-key scopes for INTEGRATION auth; JWT users bypass scope checks. */
export const requireScope =
  (...requiredScopes: string[]) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (request.user?.role !== 'INTEGRATION') {
      return
    }

    const keyScopes = request.apiKeyScopes ?? []
    const allowed = requiredScopes.some((scope) => keyScopes.includes(scope))
    if (!allowed) {
      return reply
        .status(403)
        .send(createErrorResponse('API ключът няма необходимия обхват', 'INSUFFICIENT_SCOPE', 403))
    }
  }
