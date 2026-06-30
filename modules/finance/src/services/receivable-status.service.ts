import { Decimal } from '@prisma/client/runtime/library'

export function computeReceivableStatus(
  amountDue: Decimal | number,
  amountPaid: Decimal | number,
  dueDate: Date,
  storedStatus: string
): string {
  const due = new Decimal(amountDue)
  const paid = new Decimal(amountPaid)

  if (storedStatus === 'PAID' || paid.gte(due)) return 'PAID'
  if (paid.gt(0)) {
    if (dueDate < new Date() && storedStatus !== 'CANCELLED') return 'OVERDUE'
    return 'PARTIALLY_PAID'
  }
  if (dueDate < new Date()) return 'OVERDUE'
  return storedStatus === 'PARTIALLY_PAID' ? 'PARTIALLY_PAID' : 'OPEN'
}

export function computePaymentStatus(amountDue: Decimal, amountPaid: Decimal): string {
  if (amountPaid.gte(amountDue)) return 'PAID'
  if (amountPaid.gt(0)) return 'PARTIALLY_PAID'
  return 'OPEN'
}
