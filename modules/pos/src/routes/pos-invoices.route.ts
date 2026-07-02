import { createErrorResponse, createSuccessResponse, authenticate } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { buildPosInvoicePdf } from '../services/pos-invoice-pdf.service'
import {
  createPosInvoice,
  getNextPosInvoiceNumber,
  serializePosInvoice
} from '../services/pos-invoice.service'
import { isFinanceModuleEnabled } from '../utils/module-check'

async function assertFinanceDisabled(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { enabledModules: true }
  })
  if (!tenant) return false
  return !isFinanceModuleEnabled(tenant.enabledModules)
}

function buildPdfInput(invoice: any, tenant: any) {
  const vatRate = Number(invoice.vatRate)
  const vatRegistered = tenant.vatRegistered
  const vatFactor = 1 + vatRate / 100

  const lines = invoice.sale.lines.map((line: any) => {
    const gross = line.totalPrice
    const net = vatRegistered ? gross / vatFactor : gross
    const unitNet = vatRegistered ? line.unitPrice / vatFactor : line.unitPrice
    return {
      description: `${line.product.code} — ${line.product.name}`,
      quantity: line.quantity,
      unit: line.product.unit,
      unitPrice: unitNet,
      vatRate: vatRegistered ? vatRate : 0,
      lineTotal: net
    }
  })

  return {
    number: invoice.number,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    taxEventDate: invoice.taxEventDate,
    status: invoice.status,
    paymentMethod: invoice.paymentMethod,
    subtotal: Number(invoice.subtotal),
    vatAmount: Number(invoice.vatAmount),
    totalAmount: Number(invoice.totalAmount),
    vatRate,
    note: invoice.note,
    issuer: {
      name: tenant.name,
      address: tenant.address,
      city: tenant.city,
      eik: tenant.eik,
      vatNumber: tenant.vatNumber,
      vatRegistered: tenant.vatRegistered,
      mol: tenant.mol,
      phone: tenant.phone,
      email: tenant.email,
      bankName: tenant.bankName,
      bankIban: tenant.bankIban
    },
    recipient: {
      name: invoice.customer.name,
      eik: invoice.customer.eik,
      vatNumber: invoice.customer.vatNumber,
      address: invoice.customer.address,
      city: invoice.customer.city,
      contactPerson: invoice.customer.contactPerson
    },
    lines
  }
}

const posInvoicesRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', authenticate)

  fastify.get('/invoices/next-number', { schema: { tags: ['POS'] } }, async (request, reply) => {
    if (!(await assertFinanceDisabled(request.user.tenantId))) {
      return reply.status(403).send(createErrorResponse('Модулът Финанси е активен', 'FINANCE_MODULE_ENABLED', 403))
    }
    const number = await getNextPosInvoiceNumber(request.user.tenantId)
    return createSuccessResponse({ number })
  })

  fastify.get('/invoices', { schema: { tags: ['POS'] } }, async (request, reply) => {
    if (!(await assertFinanceDisabled(request.user.tenantId))) {
      return reply.status(403).send(createErrorResponse('Модулът Финанси е активен', 'FINANCE_MODULE_ENABLED', 403))
    }
    const query = request.query as { status?: string; customerId?: string }
    const invoices = await prisma.posInvoice.findMany({
      where: {
        tenantId: request.user.tenantId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.customerId ? { customerId: query.customerId } : {})
      },
      include: { customer: true, sale: { select: { saleNo: true } } },
      orderBy: { createdAt: 'desc' }
    })
    return createSuccessResponse(invoices.map(serializePosInvoice))
  })

  fastify.get('/invoices/:id', async (request, reply) => {
    if (!(await assertFinanceDisabled(request.user.tenantId))) {
      return reply.status(403).send(createErrorResponse('Модулът Финанси е активен', 'FINANCE_MODULE_ENABLED', 403))
    }
    const params = request.params as { id: string }
    const invoice = await prisma.posInvoice.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: {
        customer: true,
        sale: { include: { lines: { include: { product: true } }, cashRegister: true } }
      }
    })
    if (!invoice) {
      return reply.status(404).send(createErrorResponse('Фактурата не е намерена', 'NOT_FOUND', 404))
    }
    return createSuccessResponse(serializePosInvoice(invoice))
  })

  fastify.post('/invoices', async (request, reply) => {
    if (!(await assertFinanceDisabled(request.user.tenantId))) {
      return reply.status(403).send(createErrorResponse('Модулът Финанси е активен', 'FINANCE_MODULE_ENABLED', 403))
    }
    const body = request.body as {
      saleId: string
      customerId: string
      issueDate: string
      dueDate?: string
      taxEventDate?: string
      vatRate?: number
      note?: string
      overrideNumber?: string
    }

    try {
      const invoice = await createPosInvoice({
        saleId: body.saleId,
        customerId: body.customerId,
        issueDate: new Date(body.issueDate),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        taxEventDate: body.taxEventDate ? new Date(body.taxEventDate) : null,
        vatRate: body.vatRate,
        note: body.note,
        overrideNumber: body.overrideNumber,
        userId: request.user.id,
        tenantId: request.user.tenantId
      })
      return createSuccessResponse(serializePosInvoice(invoice))
    } catch (error) {
      const message = (error as Error).message
      if (message === 'FINANCE_MODULE_ENABLED') {
        return reply.status(403).send(createErrorResponse('Модулът Финанси е активен', message, 403))
      }
      if (message === 'SALE_NOT_FOUND') {
        return reply.status(404).send(createErrorResponse('Продажбата не е намерена', message, 404))
      }
      if (message === 'INVOICE_EXISTS') {
        return reply.status(409).send(createErrorResponse('Вече има фактура за тази продажба', message, 409))
      }
      if (message === 'DUPLICATE_NUMBER') {
        return reply.status(409).send(createErrorResponse('Номерът на фактурата вече съществува', message, 409))
      }
      if (message === 'INVALID_NUMBER_FORMAT') {
        return reply.status(400).send(createErrorResponse('Невалиден формат на номер', message, 400))
      }
      if (message === 'CUSTOMER_NOT_FOUND') {
        return reply.status(400).send(createErrorResponse('Невалиден контрагент', message, 400))
      }
      throw error
    }
  })

  fastify.get('/invoices/:id/pdf', async (request, reply) => {
    if (!(await assertFinanceDisabled(request.user.tenantId))) {
      return reply.status(403).send(createErrorResponse('Модулът Финанси е активен', 'FINANCE_MODULE_ENABLED', 403))
    }
    const params = request.params as { id: string }
    const invoice = await prisma.posInvoice.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: {
        customer: true,
        sale: { include: { lines: { include: { product: true } } } }
      }
    })
    if (!invoice) {
      return reply.status(404).send(createErrorResponse('Фактурата не е намерена', 'NOT_FOUND', 404))
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: request.user.tenantId } })
    if (!tenant) {
      return reply.status(404).send(createErrorResponse('Фирмата не е намерена', 'TENANT_NOT_FOUND', 404))
    }

    const pdf = await buildPosInvoicePdf(buildPdfInput(invoice, tenant))
    reply.header('Content-Type', 'application/pdf')
    reply.header('Content-Disposition', `attachment; filename="invoice-${invoice.number}.pdf"`)
    return reply.send(pdf)
  })

  fastify.post('/invoices/:id/cancel', async (request, reply) => {
    if (!(await assertFinanceDisabled(request.user.tenantId))) {
      return reply.status(403).send(createErrorResponse('Модулът Финанси е активен', 'FINANCE_MODULE_ENABLED', 403))
    }
    const params = request.params as { id: string }
    const invoice = await prisma.posInvoice.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId }
    })
    if (!invoice) {
      return reply.status(404).send(createErrorResponse('Фактурата не е намерена', 'NOT_FOUND', 404))
    }
    if (invoice.status === 'CANCELLED') {
      return reply.status(400).send(createErrorResponse('Фактурата вече е анулирана', 'ALREADY_CANCELLED', 400))
    }
    const updated = await prisma.posInvoice.update({
      where: { id: invoice.id },
      data: { status: 'CANCELLED' },
      include: { customer: true, sale: { select: { saleNo: true } } }
    })
    return createSuccessResponse(serializePosInvoice(updated))
  })
}

export default posInvoicesRoute
