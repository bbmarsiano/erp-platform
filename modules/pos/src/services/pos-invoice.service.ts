import { prisma } from '@dflow/db'
import type { Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { isFinanceModuleEnabled } from '../utils/module-check'

export function formatPosInvoiceNumber(value: number): string {
  return String(value).padStart(10, '0')
}

export function parsePosInvoiceNumber(value: string): number {
  const trimmed = value.trim()
  if (!/^\d{1,10}$/.test(trimmed)) {
    throw new Error('INVALID_NUMBER_FORMAT')
  }
  return Number.parseInt(trimmed, 10)
}

export async function getNextPosInvoiceNumber(tenantId: string): Promise<string> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { posInvoiceStartNumber: true, posInvoiceLastNumber: true }
  })
  if (!tenant) throw new Error('TENANT_NOT_FOUND')
  const next = Math.max(tenant.posInvoiceLastNumber + 1, tenant.posInvoiceStartNumber)
  return formatPosInvoiceNumber(next)
}

function calculateSaleInvoiceTotals(
  saleTotal: number,
  vatRate: number,
  vatRegistered: boolean
): { subtotal: Decimal; vatAmount: Decimal; totalAmount: Decimal } {
  const totalAmount = new Decimal(saleTotal)
  if (!vatRegistered) {
    return { subtotal: totalAmount, vatAmount: new Decimal(0), totalAmount }
  }
  const vatFactor = new Decimal(1).add(new Decimal(vatRate).div(100))
  const subtotal = totalAmount.div(vatFactor)
  const vatAmount = totalAmount.sub(subtotal)
  return { subtotal, vatAmount, totalAmount }
}

async function allocateInvoiceNumber(
  tx: Prisma.TransactionClient,
  tenantId: string,
  overrideNumber?: string
): Promise<string> {
  const tenant = await tx.tenant.findUnique({
    where: { id: tenantId },
    select: { posInvoiceStartNumber: true, posInvoiceLastNumber: true }
  })
  if (!tenant) throw new Error('TENANT_NOT_FOUND')

  let number: string
  let numericValue: number

  if (overrideNumber) {
    numericValue = parsePosInvoiceNumber(overrideNumber)
    number = formatPosInvoiceNumber(numericValue)
    const existing = await tx.posInvoice.findUnique({
      where: { tenantId_number: { tenantId, number } }
    })
    if (existing) throw new Error('DUPLICATE_NUMBER')
  } else {
    numericValue = Math.max(tenant.posInvoiceLastNumber + 1, tenant.posInvoiceStartNumber)
    number = formatPosInvoiceNumber(numericValue)
  }

  await tx.tenant.update({
    where: { id: tenantId },
    data: {
      posInvoiceLastNumber: Math.max(tenant.posInvoiceLastNumber, numericValue)
    }
  })

  return number
}

export type CreatePosInvoiceInput = {
  saleId: string
  customerId: string
  issueDate: Date
  dueDate?: Date | null
  taxEventDate?: Date | null
  vatRate?: number
  note?: string | null
  overrideNumber?: string
  userId: string
  tenantId: string
}

export async function createPosInvoice(input: CreatePosInvoiceInput) {
  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.findUnique({
      where: { id: input.tenantId },
      select: { enabledModules: true, vatRegistered: true }
    })
    if (!tenant) throw new Error('TENANT_NOT_FOUND')
    if (isFinanceModuleEnabled(tenant.enabledModules)) {
      throw new Error('FINANCE_MODULE_ENABLED')
    }

    const sale = await tx.sale.findFirst({
      where: { id: input.saleId, tenantId: input.tenantId, status: 'COMPLETED' },
      include: { posInvoice: true }
    })
    if (!sale) throw new Error('SALE_NOT_FOUND')
    if (sale.posInvoice) throw new Error('INVOICE_EXISTS')

    const customer = await tx.customer.findFirst({
      where: { id: input.customerId, tenantId: input.tenantId, isActive: true }
    })
    if (!customer) throw new Error('CUSTOMER_NOT_FOUND')

    const vatRate = input.vatRate ?? 20
    const totals = calculateSaleInvoiceTotals(sale.totalAmount, vatRate, tenant.vatRegistered)
    const number = await allocateInvoiceNumber(tx, input.tenantId, input.overrideNumber)

    const invoice = await tx.posInvoice.create({
      data: {
        tenantId: input.tenantId,
        number,
        saleId: sale.id,
        customerId: customer.id,
        issueDate: input.issueDate,
        dueDate: input.dueDate ?? null,
        taxEventDate: input.taxEventDate ?? input.issueDate,
        subtotal: totals.subtotal,
        vatAmount: totals.vatAmount,
        totalAmount: totals.totalAmount,
        vatRate,
        paymentMethod: sale.paymentMethod,
        note: input.note ?? null,
        createdBy: input.userId
      },
      include: {
        customer: true,
        sale: { include: { lines: { include: { product: true } } } }
      }
    })

    return invoice
  })
}

export function serializePosInvoice(invoice: {
  subtotal: Decimal | number
  vatAmount: Decimal | number
  totalAmount: Decimal | number
  vatRate: Decimal | number
  [key: string]: unknown
}) {
  return {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    vatAmount: Number(invoice.vatAmount),
    totalAmount: Number(invoice.totalAmount),
    vatRate: Number(invoice.vatRate)
  }
}
