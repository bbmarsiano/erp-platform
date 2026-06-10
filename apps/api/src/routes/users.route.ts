import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { prisma } from '@dflow/db'
import bcrypt from 'bcryptjs'
import { authenticate } from '../middleware/authenticate'

const usersRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // GET /api/users — list all users for tenant
  fastify.get(
    '/users',
    {
      schema: {
        tags: ['Users'],
        summary: 'Списък потребители'
      },
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const { role } = request.user
      if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
        return reply.status(403).send({ success: false, error: 'Нямате права за тази операция' })
      }

      const users = await prisma.user.findMany({
        where: { tenantId: request.user.tenantId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true
        },
        orderBy: { createdAt: 'asc' }
      })
      return reply.send({ success: true, data: users })
    }
  )

  // POST /api/users — create user (ADMIN+ only)
  fastify.post(
    '/users',
    {
      schema: {
        tags: ['Users'],
        summary: 'Създай потребител',
        body: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName', 'role'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'OPERATOR', 'READONLY'] }
          }
        }
      },
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const { role } = request.user
      if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
        return reply.status(403).send({ success: false, error: 'Нямате права за тази операция' })
      }
      const body = request.body as {
        email: string
        password: string
        firstName: string
        lastName: string
        role: string
      }
      const existing = await prisma.user.findUnique({ where: { email: body.email } })
      if (existing) {
        return reply.status(409).send({ success: false, error: 'Потребител с този имейл вече съществува' })
      }
      const hashedPassword = await bcrypt.hash(body.password, 10)
      const user = await prisma.user.create({
        data: {
          email: body.email,
          hashedPassword,
          firstName: body.firstName,
          lastName: body.lastName,
          role: body.role as 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'READONLY',
          tenantId: request.user.tenantId,
          isActive: true
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true
        }
      })
      await prisma.auditLog.create({
        data: {
          tenantId: request.user.tenantId,
          userId: request.user.id,
          action: 'CREATE_USER',
          entity: 'User',
          entityId: user.id,
          payload: { email: user.email, role: user.role }
        }
      })
      return reply.status(201).send({ success: true, data: user })
    }
  )

  // PUT /api/users/:id — update user
  fastify.put(
    '/users/:id',
    {
      schema: { tags: ['Users'], summary: 'Обнови потребител' },
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const { role } = request.user
      if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
        return reply.status(403).send({ success: false, error: 'Нямате права' })
      }
      const { id } = request.params as { id: string }
      const body = request.body as Partial<{
        firstName: string
        lastName: string
        role: string
        isActive: boolean
        newPassword: string
      }>

      let hashedPassword: string | undefined
      if (body.newPassword && body.newPassword.length >= 8) {
        hashedPassword = await bcrypt.hash(body.newPassword, 10)
      }
      const user = await prisma.user.update({
        where: { id, tenantId: request.user.tenantId },
        data: {
          ...(body.firstName && { firstName: body.firstName }),
          ...(body.lastName && { lastName: body.lastName }),
          ...(body.role && { role: body.role as 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'READONLY' }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
          ...(hashedPassword && { hashedPassword })
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true
        }
      })
      return reply.send({ success: true, data: user })
    }
  )

  // GET /api/tenant — get tenant info
  fastify.get(
    '/tenant',
    {
      schema: { tags: ['Users'], summary: 'Информация за фирмата' },
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: request.user.tenantId }
      })
      return reply.send({ success: true, data: tenant })
    }
  )

  // PUT /api/tenant — update tenant (name, logoUrl)
  fastify.put(
    '/tenant',
    {
      schema: { tags: ['Users'], summary: 'Обнови настройки на фирмата' },
      preHandler: [authenticate]
    },
    async (request, reply) => {
      if (request.user.role !== 'SUPER_ADMIN') {
        return reply
          .status(403)
          .send({ success: false, error: 'Само Супер Админ може да променя настройките на фирмата' })
      }
      const body = request.body as {
        name?: string
        logoUrl?: string | null
        address?: string
        eik?: string
        vatNumber?: string
        vatRegistered?: boolean
        mol?: string
        city?: string
        country?: string
        phone?: string
        email?: string
        bankName?: string
        bankIban?: string
      }
      const tenant = await prisma.tenant.update({
        where: { id: request.user.tenantId },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
          ...(body.address !== undefined && { address: body.address }),
          ...(body.eik !== undefined && { eik: body.eik }),
          ...(body.vatNumber !== undefined && { vatNumber: body.vatNumber }),
          ...(body.vatRegistered !== undefined && { vatRegistered: body.vatRegistered }),
          ...(body.mol !== undefined && { mol: body.mol }),
          ...(body.city !== undefined && { city: body.city }),
          ...(body.country !== undefined && { country: body.country }),
          ...(body.phone !== undefined && { phone: body.phone }),
          ...(body.email !== undefined && { email: body.email }),
          ...(body.bankName !== undefined && { bankName: body.bankName }),
          ...(body.bankIban !== undefined && { bankIban: body.bankIban })
        }
      })
      return reply.send({ success: true, data: tenant })
    }
  )

  // DELETE /api/users/:id — deactivate (soft delete)
  fastify.delete(
    '/users/:id',
    {
      schema: { tags: ['Users'], summary: 'Деактивирай потребител' },
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const { role, id: currentUserId } = request.user
      if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
        return reply.status(403).send({ success: false, error: 'Нямате права' })
      }
      const { id } = request.params as { id: string }
      if (id === currentUserId) {
        return reply.status(400).send({ success: false, error: 'Не можете да деактивирате собствения си акаунт' })
      }
      await prisma.user.update({
        where: { id, tenantId: request.user.tenantId },
        data: { isActive: false }
      })
      return reply.send({ success: true, message: 'Потребителят е деактивиран' })
    }
  )
}

export default usersRoute
