import { createErrorResponse, createSuccessResponse, authenticate, requireRole, requireTenantModule } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { listCustomers } from '../services/customer.service'
import type { CustomerInput } from '../types/finance.types'

const financeGuards = [authenticate, requireRole('SUPER_ADMIN', 'MANAGER'), requireTenantModule('finance')]

const customersRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/customers', { preHandler: financeGuards, schema: { tags: ['FINANCE'] } }, async (request) => {
    const query = request.query as { search?: string; isActive?: string }
    const data = await listCustomers(
      request.user.tenantId,
      query.search,
      query.isActive !== undefined ? query.isActive === 'true' : undefined
    )
    return createSuccessResponse(data)
  })

  fastify.post('/customers', { preHandler: financeGuards }, async (request) => {
    const body = request.body as CustomerInput
    const created = await prisma.customer.create({
      data: {
        tenantId: request.user.tenantId,
        code: body.code,
        name: body.name,
        eik: body.eik,
        vatNumber: body.vatNumber,
        address: body.address,
        city: body.city,
        email: body.email,
        phone: body.phone,
        contactPerson: body.contactPerson,
        isActive: true
      }
    })
    return createSuccessResponse(created)
  })

  fastify.get('/customers/:id', { preHandler: financeGuards }, async (request, reply) => {
    const params = request.params as { id: string }
    const customer = await prisma.customer.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId }
    })
    if (!customer) {
      return reply.status(404).send(createErrorResponse('Customer not found', 'CUSTOMER_NOT_FOUND', 404))
    }
    return createSuccessResponse(customer)
  })

  fastify.put('/customers/:id', { preHandler: financeGuards }, async (request, reply) => {
    const params = request.params as { id: string }
    const body = request.body as Partial<CustomerInput>
    const updated = await prisma.customer.updateMany({
      where: { id: params.id, tenantId: request.user.tenantId },
      data: {
        code: body.code,
        name: body.name,
        eik: body.eik,
        vatNumber: body.vatNumber,
        address: body.address,
        city: body.city,
        email: body.email,
        phone: body.phone,
        contactPerson: body.contactPerson
      }
    })
    if (!updated.count) {
      return reply.status(404).send(createErrorResponse('Customer not found', 'CUSTOMER_NOT_FOUND', 404))
    }
    const customer = await prisma.customer.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId }
    })
    return createSuccessResponse(customer)
  })

  fastify.delete('/customers/:id', { preHandler: financeGuards }, async (request, reply) => {
    const params = request.params as { id: string }
    const updated = await prisma.customer.updateMany({
      where: { id: params.id, tenantId: request.user.tenantId },
      data: { isActive: false }
    })
    if (!updated.count) {
      return reply.status(404).send(createErrorResponse('Customer not found', 'CUSTOMER_NOT_FOUND', 404))
    }
    return createSuccessResponse({ deleted: true })
  })
}

export default customersRoute
