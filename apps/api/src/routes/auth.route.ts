import { prisma } from '@dflow/db'
import bcrypt from 'bcryptjs'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
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

const authRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // POST /api/auth/login
  fastify.post(
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
                  },
                  allowedVersion: { type: ['string', 'null'] }
                }
              }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const { email, password } = request.body as { email: string; password: string }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true }
      })

      if (!user || !user.isActive) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
          statusCode: 401
        })
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.hashedPassword)
      if (!validPassword) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
          statusCode: 401
        })
      }

      // Sign tokens
      const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      }

      const accessToken = fastify.jwt.sign(payload, { expiresIn: '15m' })
      const refreshToken = fastify.jwt.sign(
        { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId, type: 'refresh' } as any,
        { expiresIn: '7d' }
      )

      // Audit log
      await prisma.auditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          action: 'LOGIN',
          entity: 'User',
          entityId: user.id,
          payload: { email: user.email }
        }
      })

      let allowedVersion: string | null = null
      try {
        const licenseKey = process.env.LICENSE_KEY
        const licenseServerUrl = process.env.LICENSE_SERVER_URL
        const licenseServerKey = process.env.LICENSE_SERVER_KEY
        if (licenseKey && licenseServerUrl && licenseServerKey) {
          const licResp = await fetch(
            `${licenseServerUrl}/functions/v1/validate-license`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${licenseServerKey}`
              },
              body: JSON.stringify({ key: licenseKey })
            }
          )
          const licData = (await licResp.json()) as { valid?: boolean; allowedVersion?: string | null }
          if (licData.valid) allowedVersion = licData.allowedVersion ?? null
        }
      } catch {
        /* ignore license check errors */
      }

      return reply.send({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            tenantId: user.tenantId
          },
          allowedVersion
        }
      })
    }
  )

  // POST /api/auth/refresh
  fastify.post(
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
    async (request, reply) => {
      const { refreshToken } = request.body as { refreshToken: string }

      try {
        const decoded = fastify.jwt.verify(refreshToken) as { id: string; type: string }

        if (decoded.type !== 'refresh') {
          return reply
            .status(401)
            .send({ success: false, error: 'Invalid token', code: 'INVALID_TOKEN', statusCode: 401 })
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.id } })
        if (!user || !user.isActive) {
          return reply
            .status(401)
            .send({ success: false, error: 'User not found', code: 'USER_NOT_FOUND', statusCode: 401 })
        }

        const accessToken = fastify.jwt.sign(
          { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
          { expiresIn: '15m' }
        )

        return reply.send({ success: true, data: { accessToken } })
      } catch {
        return reply
          .status(401)
          .send({ success: false, error: 'Invalid token', code: 'INVALID_TOKEN', statusCode: 401 })
      }
    }
  )

  // POST /api/auth/logout
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
    async (_request, reply) => {
      return reply.send({ success: true, message: 'Logged out successfully' })
    }
  )
}

export default authRoute
