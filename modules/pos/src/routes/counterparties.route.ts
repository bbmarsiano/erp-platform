import { createErrorResponse, createSuccessResponse, authenticate } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { listCounterparties, nextCounterpartyCode } from '../services/counterparty.service'

type CounterpartyInput = {
  name: string
  eik?: string
  vatNumber?: string
  address?: string
  city?: string
  email?: string
  phone?: string
  contactPerson?: string
  code?: string
}

const counterpartiesRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/counterparties', { preHandler: [authenticate], schema: { tags: ['POS'] } }, async (request) => {
    const query = request.query as { search?: string; isActive?: string }
    const data = await listCounterparties(
      request.user.tenantId,
      query.search,
      query.isActive !== undefined ? query.isActive === 'true' : true
    )
    return createSuccessResponse(data)
  })

  fastify.post('/counterparties', { preHandler: [authenticate] }, async (request, reply) => {
    const body = request.body as CounterpartyInput
    if (!body.name?.trim()) {
      return reply.status(400).send(createErrorResponse('Наименованието е задължително', 'VALIDATION_ERROR', 400))
    }
    const code = body.code?.trim() || (await nextCounterpartyCode(request.user.tenantId))
    const created = await prisma.customer.create({
      data: {
        tenantId: request.user.tenantId,
        code,
        name: body.name.trim(),
        eik: body.eik?.trim() || null,
        vatNumber: body.vatNumber?.trim() || null,
        address: body.address?.trim() || null,
        city: body.city?.trim() || null,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        contactPerson: body.contactPerson?.trim() || null,
        isActive: true
      }
    })
    return createSuccessResponse(created)
  })

  fastify.get('/counterparties/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const customer = await prisma.customer.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId }
    })
    if (!customer) {
      return reply.status(404).send(createErrorResponse('Контрагентът не е намерен', 'NOT_FOUND', 404))
    }

    const purchaseHistory = await prisma.sale.findMany({
      where: { tenantId: request.user.tenantId, customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        lines: true,
        posInvoice: { select: { id: true, number: true, status: true } }
      }
    })

    return createSuccessResponse({
      ...customer,
      purchaseHistory: purchaseHistory.map((sale) => ({
        id: sale.id,
        saleNo: sale.saleNo,
        createdAt: sale.createdAt,
        totalAmount: sale.totalAmount,
        itemsCount: sale.lines.length,
        status: sale.status,
        posInvoice: sale.posInvoice
      }))
    })
  })

  fastify.put('/counterparties/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const body = request.body as Partial<CounterpartyInput>
    const updated = await prisma.customer.updateMany({
      where: { id: params.id, tenantId: request.user.tenantId },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.eik !== undefined && { eik: body.eik?.trim() || null }),
        ...(body.vatNumber !== undefined && { vatNumber: body.vatNumber?.trim() || null }),
        ...(body.address !== undefined && { address: body.address?.trim() || null }),
        ...(body.city !== undefined && { city: body.city?.trim() || null }),
        ...(body.email !== undefined && { email: body.email?.trim() || null }),
        ...(body.phone !== undefined && { phone: body.phone?.trim() || null }),
        ...(body.contactPerson !== undefined && { contactPerson: body.contactPerson?.trim() || null })
      }
    })
    if (!updated.count) {
      return reply.status(404).send(createErrorResponse('Контрагентът не е намерен', 'NOT_FOUND', 404))
    }
    const customer = await prisma.customer.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId }
    })
    return createSuccessResponse(customer)
  })

  fastify.delete('/counterparties/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const params = request.params as { id: string }
    const updated = await prisma.customer.updateMany({
      where: { id: params.id, tenantId: request.user.tenantId },
      data: { isActive: false }
    })
    if (!updated.count) {
      return reply.status(404).send(createErrorResponse('Контрагентът не е намерен', 'NOT_FOUND', 404))
    }
    return createSuccessResponse({ deleted: true })
  })
}

export default counterpartiesRoute
