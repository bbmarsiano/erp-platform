import { createErrorResponse, createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../../../apps/api/src/middleware/authenticate'
import { listSuppliers } from '../services/supplier.service'
import type { SupplierInput } from '../types/scm.types'

const suppliersRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/suppliers', { preHandler: [authenticate], schema: { tags: ['SCM'] } }, async (request) => {
    const query = request.query as { isActive?: string }
    const data = await listSuppliers(
      request.user.tenantId,
      query.isActive !== undefined ? query.isActive === 'true' : undefined
    )
    return createSuccessResponse(data)
  })

  fastify.post('/suppliers', { preHandler: [authenticate] }, async (request) => {
    const body = request.body as SupplierInput
    const created = await prisma.supplier.create({
      data: {
        tenantId: request.user.tenantId,
        code: body.code,
        name: body.name,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        taxNumber: body.taxNumber,
        isActive: true
      }
    })
    return createSuccessResponse(created)
  })

  fastify.get('/suppliers/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const supplier = await prisma.supplier.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    })
    if (!supplier) {
      return reply.status(404).send(createErrorResponse('Supplier not found', 'SUPPLIER_NOT_FOUND', 404))
    }
    return createSuccessResponse(supplier)
  })

  fastify.put('/suppliers/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const body = request.body as Partial<SupplierInput>
    const updated = await prisma.supplier.updateMany({
      where: { id: params.id, tenantId: request.user.tenantId },
      data: {
        code: body.code,
        name: body.name,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        taxNumber: body.taxNumber
      }
    })
    if (!updated.count) {
      return reply.status(404).send(createErrorResponse('Supplier not found', 'SUPPLIER_NOT_FOUND', 404))
    }
    return createSuccessResponse({ updated: true })
  })

  fastify.delete('/suppliers/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const updated = await prisma.supplier.updateMany({
      where: { id: params.id, tenantId: request.user.tenantId },
      data: { isActive: false }
    })
    if (!updated.count) {
      return reply.status(404).send(createErrorResponse('Supplier not found', 'SUPPLIER_NOT_FOUND', 404))
    }
    return createSuccessResponse({ deleted: true })
  })
}

export default suppliersRoute

