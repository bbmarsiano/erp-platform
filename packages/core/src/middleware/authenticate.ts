import { prisma } from '@dflow/db'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { hashApiKey, isApiKeyToken } from '../utils/api-key.utils.js'

export interface JwtPayload {
  id: string
  email: string
  role: string
  tenantId: string
}

type JwtVerifyRequest = FastifyRequest & {
  jwtVerify: () => Promise<unknown>
}

function extractBearerToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.slice(7).trim()
  return token || null
}

async function authenticateApiKey(
  request: FastifyRequest,
  reply: FastifyReply,
  rawKey: string
): Promise<boolean> {
  const keyHash = hashApiKey(rawKey)
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash }
  })

  if (!apiKey || !apiKey.isActive || apiKey.revokedAt) {
    await reply.status(401).send({ success: false, error: 'Invalid or expired token' })
    return false
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    await reply.status(401).send({ success: false, error: 'Invalid or expired token' })
    return false
  }

  request.user = {
    id: apiKey.id,
    email: `api-key:${apiKey.id}`,
    role: 'INTEGRATION',
    tenantId: apiKey.tenantId
  }
  request.authMethod = 'api_key'
  request.apiKeyScopes = apiKey.scopes

  void prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() }
    })
    .catch(() => undefined)

  return true
}

export const authenticate = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const token = extractBearerToken(request)

  if (token && isApiKeyToken(token)) {
    await authenticateApiKey(request, reply, token)
    return
  }

  try {
    const decoded = (await (request as JwtVerifyRequest).jwtVerify()) as JwtPayload

    request.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId
    }
    request.authMethod = 'jwt'
  } catch {
    return reply.status(401).send({ success: false, error: 'Invalid or expired token' })
  }
}
