import { createErrorResponse, createSuccessResponse, authenticate, requireRole, requireTenantModule } from '@dflow/core'
import { prisma } from '@dflow/db'
import { Decimal } from '@prisma/client/runtime/library'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { getNextDocumentNumber } from '../services/document-numbering.service'
import { calculateInvoiceTotals, type InvoiceLineInput } from '../services/invoice-calc.service'
import { buildInvoicePdf } from '../services/invoice-pdf.service'
import { assertPeriodOpen, PeriodClosedError } from '../services/period.service'
import { serializeInvoice } from '../utils/serialize-decimal'

const financeGuards = [authenticate, requireRole('SUPER_ADMIN', 'MANAGER'), requireTenantModule('finance')]

const invoiceImportLineSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  vatRate: z.number().min(0).max(100).optional()
})

const invoiceImportBodySchema = z.object({
  docType: z.enum(['INVOICE_OUT', 'INVOICE_IN']),
  number: z.string().min(1),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1).optional(),
  customerId: z.string().min(1).optional(),
  supplierId: z.string().min(1).optional(),
  currency: z.string().min(1),
  vatRate: z.number().min(0).max(100),
  note: z.string().optional(),
  status: z.enum(['ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED']),
  amountPaid: z.number().nonnegative().optional(),
  lines: z.array(invoiceImportLineSchema).min(1)
})

const invoiceInclude = {
  lines: true,
  customer: true,
  supplier: true,
  receivable: true,
  payable: true
}

const invoicesRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/invoices', { preHandler: financeGuards, schema: { tags: ['FINANCE'] } }, async (request) => {
    const query = request.query as {
      docType?: string
      status?: string
      customerId?: string
      supplierId?: string
      from?: string
      to?: string
    }

    const data = await prisma.invoice.findMany({
      where: {
        tenantId: request.user.tenantId,
        ...(query.docType ? { docType: query.docType } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.customerId ? { customerId: query.customerId } : {}),
        ...(query.supplierId ? { supplierId: query.supplierId } : {}),
        ...(query.from || query.to
          ? {
              issueDate: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lte: new Date(query.to) } : {})
              }
            }
          : {})
      },
      include: { customer: true, supplier: true },
      orderBy: { createdAt: 'desc' }
    })

    return createSuccessResponse(data.map(serializeInvoice))
  })

  fastify.get('/invoices/:id', { preHandler: financeGuards }, async (request, reply) => {
    const params = request.params as { id: string }
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: invoiceInclude
    })
    if (!invoice) return reply.status(404).send(createErrorResponse('Invoice not found', 'INVOICE_NOT_FOUND', 404))
    return createSuccessResponse(serializeInvoice(invoice))
  })

  fastify.post('/invoices', { preHandler: financeGuards }, async (request, reply) => {
    const body = request.body as {
      docType: string
      issueDate: string
      dueDate?: string
      taxEventDate?: string
      customerId?: string
      supplierId?: string
      currency?: string
      vatRate?: number
      note?: string
      relatedPOId?: string
      relatedSaleId?: string
      lines: InvoiceLineInput[]
    }

    if (!body.lines?.length) {
      return reply.status(400).send(createErrorResponse('At least one line is required', 'LINES_REQUIRED', 400))
    }

    if (body.docType === 'INVOICE_OUT' && !body.customerId) {
      return reply.status(400).send(createErrorResponse('Customer is required', 'CUSTOMER_REQUIRED', 400))
    }
    if (body.docType === 'INVOICE_IN' && !body.supplierId) {
      return reply.status(400).send(createErrorResponse('Supplier is required', 'SUPPLIER_REQUIRED', 400))
    }

    try {
      await assertPeriodOpen(request.user.tenantId, new Date(body.issueDate))
    } catch (error) {
      if (error instanceof PeriodClosedError) {
        return reply.status(400).send(createErrorResponse(error.userMessage, 'PERIOD_CLOSED', 400))
      }
      throw error
    }

    const number = await getNextDocumentNumber(request.user.tenantId, body.docType)
    const totals = calculateInvoiceTotals(body.lines, body.vatRate ?? 20)

    const created = await prisma.invoice.create({
      data: {
        tenantId: request.user.tenantId,
        docType: body.docType,
        number,
        issueDate: new Date(body.issueDate),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        taxEventDate: body.taxEventDate ? new Date(body.taxEventDate) : null,
        customerId: body.customerId ?? null,
        supplierId: body.supplierId ?? null,
        currency: body.currency ?? 'BGN',
        subtotal: totals.subtotal,
        vatAmount: totals.vatAmount,
        totalAmount: totals.totalAmount,
        vatRate: totals.vatRate,
        status: 'DRAFT',
        note: body.note,
        relatedPOId: body.relatedPOId,
        relatedSaleId: body.relatedSaleId,
        createdBy: request.user.id,
        lines: {
          create: totals.lines.map((l) => ({
            productId: l.productId ?? null,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            vatRate: l.vatRate,
            lineTotal: l.lineTotal
          }))
        }
      },
      include: invoiceInclude
    })

    return createSuccessResponse(serializeInvoice(created))
  })

  fastify.post('/invoices/import', { preHandler: financeGuards }, async (request, reply) => {
    const parsed = invoiceImportBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Невалидни данни за импорт.',
        details: parsed.error.flatten()
      })
    }

    const body = parsed.data

    if (body.docType === 'INVOICE_OUT' && !body.customerId) {
      return reply.status(400).send(createErrorResponse('Customer is required', 'CUSTOMER_REQUIRED', 400))
    }
    if (body.docType === 'INVOICE_IN' && !body.supplierId) {
      return reply.status(400).send(createErrorResponse('Supplier is required', 'SUPPLIER_REQUIRED', 400))
    }

    try {
      await assertPeriodOpen(request.user.tenantId, new Date(body.issueDate))
    } catch (error) {
      if (error instanceof PeriodClosedError) {
        return reply.status(400).send(createErrorResponse(error.userMessage, 'PERIOD_CLOSED', 400))
      }
      throw error
    }

    const number = body.number.trim()
    const totals = calculateInvoiceTotals(body.lines, body.vatRate)

    if (body.status === 'PARTIALLY_PAID') {
      if (body.amountPaid === undefined) {
        return reply
          .status(400)
          .send(
            createErrorResponse(
              'amountPaid is required when status is PARTIALLY_PAID',
              'AMOUNT_PAID_REQUIRED',
              400
            )
          )
      }
      if (!new Decimal(body.amountPaid).lt(totals.totalAmount)) {
        return reply
          .status(400)
          .send(
            createErrorResponse(
              'amountPaid must be less than totalAmount when status is PARTIALLY_PAID',
              'AMOUNT_PAID_INVALID',
              400
            )
          )
      }
    }

    const dueDate = body.dueDate ? new Date(body.dueDate) : new Date(body.issueDate)

    let arApAmountPaid = new Decimal(0)
    let arApStatus = 'OPEN'
    if (body.status === 'PAID') {
      arApAmountPaid = totals.totalAmount
      arApStatus = 'PAID'
    } else if (body.status === 'PARTIALLY_PAID') {
      arApAmountPaid = new Decimal(body.amountPaid!)
      arApStatus = 'PARTIALLY_PAID'
    }

    try {
      const created = await prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.create({
          data: {
            tenantId: request.user.tenantId,
            docType: body.docType,
            number,
            issueDate: new Date(body.issueDate),
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
            customerId: body.customerId ?? null,
            supplierId: body.supplierId ?? null,
            currency: body.currency,
            subtotal: totals.subtotal,
            vatAmount: totals.vatAmount,
            totalAmount: totals.totalAmount,
            vatRate: totals.vatRate,
            status: body.status,
            source: 'IMPORT',
            note: body.note,
            createdBy: request.user.id,
            lines: {
              create: totals.lines.map((l) => ({
                productId: null,
                description: l.description,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                vatRate: l.vatRate,
                lineTotal: l.lineTotal
              }))
            }
          }
        })

        if (body.status !== 'CANCELLED') {
          if (body.docType === 'INVOICE_OUT' && body.customerId) {
            await tx.receivable.create({
              data: {
                tenantId: request.user.tenantId,
                invoiceId: invoice.id,
                customerId: body.customerId,
                amountDue: totals.totalAmount,
                amountPaid: arApAmountPaid,
                dueDate,
                status: arApStatus
              }
            })
          }
          if (body.docType === 'INVOICE_IN' && body.supplierId) {
            await tx.payable.create({
              data: {
                tenantId: request.user.tenantId,
                invoiceId: invoice.id,
                supplierId: body.supplierId,
                amountDue: totals.totalAmount,
                amountPaid: arApAmountPaid,
                dueDate,
                status: arApStatus
              }
            })
          }
        }

        return tx.invoice.findFirst({
          where: { id: invoice.id },
          include: invoiceInclude
        })
      })

      return createSuccessResponse(serializeInvoice(created!))
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        return reply
          .status(409)
          .send(
            createErrorResponse(
              `Фактура с номер ${number} вече съществува.`,
              'DUPLICATE_INVOICE_NUMBER',
              409
            )
          )
      }
      throw error
    }
  })

  fastify.put('/invoices/:id', { preHandler: financeGuards }, async (request, reply) => {
    const params = request.params as { id: string }
    const body = request.body as {
      issueDate?: string
      dueDate?: string
      taxEventDate?: string
      customerId?: string
      supplierId?: string
      currency?: string
      vatRate?: number
      note?: string
      lines?: InvoiceLineInput[]
    }

    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: { lines: true }
    })
    if (!existing) return reply.status(404).send(createErrorResponse('Invoice not found', 'INVOICE_NOT_FOUND', 404))
    if (existing.status !== 'DRAFT') {
      return reply.status(400).send(createErrorResponse('Only draft invoices can be edited', 'INVALID_STATUS', 400))
    }

    const vatRate = body.vatRate ?? Number(existing.vatRate)
    const lines = body.lines ?? existing.lines.map((l) => ({
      description: l.description,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      vatRate: Number(l.vatRate),
      productId: l.productId
    }))
    const totals = calculateInvoiceTotals(lines, vatRate)

    const updated = await prisma.$transaction(async (tx) => {
      if (body.lines) {
        await tx.invoiceLine.deleteMany({ where: { invoiceId: params.id } })
      }
      return tx.invoice.update({
        where: { id: params.id },
        data: {
          issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
          dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
          taxEventDate:
            body.taxEventDate !== undefined ? (body.taxEventDate ? new Date(body.taxEventDate) : null) : undefined,
          customerId: body.customerId,
          supplierId: body.supplierId,
          currency: body.currency,
          vatRate: totals.vatRate,
          subtotal: totals.subtotal,
          vatAmount: totals.vatAmount,
          totalAmount: totals.totalAmount,
          note: body.note,
          ...(body.lines
            ? {
                lines: {
                  create: totals.lines.map((l) => ({
                    productId: l.productId ?? null,
                    description: l.description,
                    quantity: l.quantity,
                    unitPrice: l.unitPrice,
                    vatRate: l.vatRate,
                    lineTotal: l.lineTotal
                  }))
                }
              }
            : {})
        },
        include: invoiceInclude
      })
    })

    return createSuccessResponse(serializeInvoice(updated))
  })

  fastify.post('/invoices/:id/issue', { preHandler: financeGuards }, async (request, reply) => {
    const params = request.params as { id: string }
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId }
    })
    if (!invoice) return reply.status(404).send(createErrorResponse('Invoice not found', 'INVOICE_NOT_FOUND', 404))
    if (invoice.status !== 'DRAFT') {
      return reply.status(400).send(createErrorResponse('Only draft invoices can be issued', 'INVALID_STATUS', 400))
    }

    const dueDate = invoice.dueDate ?? invoice.issueDate

    const updated = await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: 'ISSUED' }
      })

      if (invoice.docType === 'INVOICE_OUT' && invoice.customerId) {
        await tx.receivable.create({
          data: {
            tenantId: invoice.tenantId,
            invoiceId: invoice.id,
            customerId: invoice.customerId,
            amountDue: invoice.totalAmount,
            amountPaid: new Decimal(0),
            dueDate,
            status: 'OPEN'
          }
        })
      }

      if (invoice.docType === 'INVOICE_IN' && invoice.supplierId) {
        await tx.payable.create({
          data: {
            tenantId: invoice.tenantId,
            invoiceId: invoice.id,
            supplierId: invoice.supplierId,
            amountDue: invoice.totalAmount,
            amountPaid: new Decimal(0),
            dueDate,
            status: 'OPEN'
          }
        })
      }

      return tx.invoice.findFirst({ where: { id: invoice.id }, include: invoiceInclude })
    })

    return createSuccessResponse(serializeInvoice(updated!))
  })

  fastify.post('/invoices/:id/cancel', { preHandler: financeGuards }, async (request, reply) => {
    const params = request.params as { id: string }
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: { receivable: true, payable: true }
    })
    if (!invoice) return reply.status(404).send(createErrorResponse('Invoice not found', 'INVOICE_NOT_FOUND', 404))
    if (invoice.status !== 'ISSUED') {
      return reply.status(400).send(createErrorResponse('Only issued invoices can be cancelled', 'INVALID_STATUS', 400))
    }

    const paid =
      Number(invoice.receivable?.amountPaid ?? 0) > 0 || Number(invoice.payable?.amountPaid ?? 0) > 0
    if (paid) {
      return reply.status(400).send(createErrorResponse('Cannot cancel invoice with payments', 'PAYMENTS_EXIST', 400))
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (invoice.receivable) {
        await tx.receivable.delete({ where: { id: invoice.receivable.id } })
      }
      if (invoice.payable) {
        await tx.payable.delete({ where: { id: invoice.payable.id } })
      }
      return tx.invoice.update({
        where: { id: invoice.id },
        data: { status: 'CANCELLED' },
        include: invoiceInclude
      })
    })

    return createSuccessResponse(serializeInvoice(updated))
  })

  fastify.get('/invoices/:id/pdf', { preHandler: financeGuards }, async (request, reply) => {
    const params = request.params as { id: string }
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, tenantId: request.user.tenantId },
      include: { lines: true, customer: true, supplier: true }
    })
    if (!invoice) return reply.status(404).send(createErrorResponse('Invoice not found', 'INVOICE_NOT_FOUND', 404))

    const pdf = await buildInvoicePdf(serializeInvoice(invoice) as any)
    reply.header('Content-Type', 'application/pdf')
    reply.header('Content-Disposition', `attachment; filename="faktura-${invoice.number}.pdf"`)
    return reply.send(pdf)
  })
}

export default invoicesRoute
