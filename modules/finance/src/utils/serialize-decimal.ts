import type { Decimal } from '@prisma/client/runtime/library'

type DecimalLike = Decimal | number | string | null | undefined

export function toNumber(value: DecimalLike): number {
  if (value == null) return 0
  return Number(value)
}

export function serializeInvoiceLine<T extends { quantity: DecimalLike; unitPrice: DecimalLike; vatRate: DecimalLike; lineTotal: DecimalLike }>(
  line: T
) {
  return {
    ...line,
    quantity: toNumber(line.quantity),
    unitPrice: toNumber(line.unitPrice),
    vatRate: toNumber(line.vatRate),
    lineTotal: toNumber(line.lineTotal)
  }
}

export function serializeInvoice<
  T extends {
    subtotal: DecimalLike
    vatAmount: DecimalLike
    totalAmount: DecimalLike
    vatRate: DecimalLike
    lines?: Array<{ quantity: DecimalLike; unitPrice: DecimalLike; vatRate: DecimalLike; lineTotal: DecimalLike }>
  }
>(invoice: T) {
  return {
    ...invoice,
    subtotal: toNumber(invoice.subtotal),
    vatAmount: toNumber(invoice.vatAmount),
    totalAmount: toNumber(invoice.totalAmount),
    vatRate: toNumber(invoice.vatRate),
    lines: invoice.lines?.map(serializeInvoiceLine)
  }
}

export function serializeReceivable<
  T extends { amountDue: DecimalLike; amountPaid: DecimalLike }
>(receivable: T) {
  return {
    ...receivable,
    amountDue: toNumber(receivable.amountDue),
    amountPaid: toNumber(receivable.amountPaid)
  }
}

export function serializePayable<T extends { amountDue: DecimalLike; amountPaid: DecimalLike }>(payable: T) {
  return {
    ...payable,
    amountDue: toNumber(payable.amountDue),
    amountPaid: toNumber(payable.amountPaid)
  }
}
