import { createErrorResponse, createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

const refreshSchema = z.object({
  refreshToken: z.string().min(10)
})

const logoutSchema = z.object({
  refreshToken: z.string().min(10).optional()
})

type LoginResponse = {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    role: string
    tenantId: string
  }
}

const authRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const jwtSecret = process.env.JWT_SECRET ?? 'change-me'
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET ?? 'change-me-too'

  fastify.post<{ Body: z.infer<typeof loginSchema> }>(
    '/auth/login',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Login',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                  refreshToken: { type: 'string' },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                      role: { type: 'string' },
                      tenantId: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof loginSchema> }>, reply: FastifyReply) => {
      const parsed = loginSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send(createErrorResponse('Invalid payload', 'VALIDATION_ERROR', 400))
      }

      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email }
      })

      if (!user || !(await bcrypt.compare(parsed.data.password, user.hashedPassword))) {
        return reply.status(401).send(createErrorResponse('Invalid credentials', 'INVALID_CREDENTIALS', 401))
      }

      const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      }

      const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '15m' })
      const refreshToken = jwt.sign(payload, jwtRefreshSecret, { expiresIn: '7d' })

      return reply.send(
        createSuccessResponse<LoginResponse>({
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId
          }
        })
      )
    }
  )

  fastify.post<{ Body: z.infer<typeof refreshSchema> }>(
    '/auth/refresh',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        body: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof refreshSchema> }>, reply: FastifyReply) => {
      const parsed = refreshSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send(createErrorResponse('Invalid payload', 'VALIDATION_ERROR', 400))
      }

      try {
        const payload = jwt.verify(parsed.data.refreshToken, jwtRefreshSecret) as {
          id: string
          email: string
          role: string
          tenantId: string
        }
        const accessToken = jwt.sign({
          id: payload.id,
          email: payload.email,
          role: payload.role,
          tenantId: payload.tenantId
        }, jwtSecret, { expiresIn: '15m' })

        return reply.send(
          createSuccessResponse<{ accessToken: string }>({
            accessToken
          })
        )
      } catch {
        return reply.status(401).send(createErrorResponse('Invalid refresh token', 'TOKEN_INVALID', 401))
      }
    }
  )

  fastify.post(
    '/auth/logout',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Logout',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async () => {
      return {
        success: true,
        message: 'Logged out successfully'
      }
    }
  )
}

export default authRoute
