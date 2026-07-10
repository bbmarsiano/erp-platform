import {
  authenticate,
  createErrorResponse,
  createSuccessResponse,
  generateApiKey,
  requireRole
} from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const superAdminGuards = [authenticate, requireRole('SUPER_ADMIN')]

const createApiKeySchema = z.object({
  name: z.string().min(1).max(120),
  scopes: z.array(z.string().min(1)).min(1),
  expiresAt: z.string().datetime().optional().nullable()
})

const apiKeysRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get(
    '/api-keys',
    {
      preHandler: superAdminGuards,
      schema: { tags: ['Settings'], summary: 'List API keys for tenant' }
    },
    async (request) => {
      const keys = await prisma.apiKey.findMany({
        where: { tenantId: request.user!.tenantId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          scopes: true,
          isActive: true,
          expiresAt: true,
          createdAt: true,
          lastUsedAt: true,
          revokedAt: true
        }
      })
      return createSuccessResponse(keys)
    }
  )

  fastify.post(
    '/api-keys',
    {
      preHandler: superAdminGuards,
      schema: { tags: ['Settings'], summary: 'Create API key (raw key returned once)' }
    },
    async (request, reply) => {
      const parsed = createApiKeySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply
          .status(400)
          .send(createErrorResponse(parsed.error.message, 'VALIDATION_ERROR', 400))
      }

      const { name, scopes, expiresAt } = parsed.data
      const { rawKey, keyHash, keyPrefix } = generateApiKey()

      const created = await prisma.apiKey.create({
        data: {
          tenantId: request.user!.tenantId,
          keyHash,
          keyPrefix,
          name,
          scopes,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          scopes: true,
          isActive: true,
          expiresAt: true,
          createdAt: true,
          lastUsedAt: true
        }
      })

      return reply.status(201).send(
        createSuccessResponse({
          ...created,
          rawKey
        })
      )
    }
  )

  fastify.delete(
    '/api-keys/:id',
    {
      preHandler: superAdminGuards,
      schema: { tags: ['Settings'], summary: 'Revoke API key' }
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const updated = await prisma.apiKey.updateMany({
        where: { id, tenantId: request.user!.tenantId, revokedAt: null },
        data: {
          isActive: false,
          revokedAt: new Date()
        }
      })

      if (!updated.count) {
        return reply.status(404).send(createErrorResponse('API ключът не е намерен', 'NOT_FOUND', 404))
      }

      return createSuccessResponse({ revoked: true })
    }
  )
}

export default apiKeysRoute
