import type { Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { computePaymentStatus } from './receivable-status.service'

export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message)
    this.name = 'PaymentError'
  }
}

export async function applyReceivablePayment(
  tx: Prisma.TransactionClient,
  params: {
    tenantId: string
    receivableId: string
    amount: number
    paymentDate?: Date
    note?: string
  }
) {
  const receivable = await tx.receivable.findFirst({
    where: { id: params.receivableId, tenantId: params.tenantId },
    include: { invoice: true }
  })
  if (!receivable) {
    throw new PaymentError('Вземането не е намерено', 'RECEIVABLE_NOT_FOUND')
  }
  if (receivable.status === 'PAID') {
    throw new PaymentError('Вземането вече е напълно платено', 'ALREADY_PAID')
  }
  if (!params.amount || params.amount <= 0) {
    throw new PaymentError('Невалидна сума за плащане', 'INVALID_AMOUNT')
  }

  const newPaid = new Decimal(receivable.amountPaid).add(params.amount)
  const status = computePaymentStatus(receivable.amountDue, newPaid)

  const updated = await tx.receivable.update({
    where: { id: receivable.id },
    data: { amountPaid: newPaid, status },
    include: { customer: true, invoice: true }
  })

  if (status === 'PAID') {
    await tx.invoice.update({ where: { id: receivable.invoiceId }, data: { status: 'PAID' } })
  } else if (status === 'PARTIALLY_PAID') {
    await tx.invoice.update({ where: { id: receivable.invoiceId }, data: { status: 'PARTIALLY_PAID' } })
  }

  if (params.note) {
    await tx.invoice.update({
      where: { id: receivable.invoiceId },
      data: {
        note: receivable.invoice.note
          ? `${receivable.invoice.note}\nПлащане ${params.amount} на ${(params.paymentDate ?? new Date()).toLocaleDateString('bg-BG')}: ${params.note}`
          : `Плащане ${params.amount}: ${params.note}`
      }
    })
  }

  return updated
}

export async function applyPayablePayment(
  tx: Prisma.TransactionClient,
  params: {
    tenantId: string
    payableId: string
    amount: number
    paymentDate?: Date
    note?: string
  }
) {
  const payable = await tx.payable.findFirst({
    where: { id: params.payableId, tenantId: params.tenantId },
    include: { invoice: true }
  })
  if (!payable) {
    throw new PaymentError('Задължението не е намерено', 'PAYABLE_NOT_FOUND')
  }
  if (payable.status === 'PAID') {
    throw new PaymentError('Задължението вече е напълно платено', 'ALREADY_PAID')
  }
  if (!params.amount || params.amount <= 0) {
    throw new PaymentError('Невалидна сума за плащане', 'INVALID_AMOUNT')
  }

  const newPaid = new Decimal(payable.amountPaid).add(params.amount)
  const status = computePaymentStatus(payable.amountDue, newPaid)

  const updated = await tx.payable.update({
    where: { id: payable.id },
    data: { amountPaid: newPaid, status },
    include: { supplier: true, invoice: true }
  })

  if (status === 'PAID') {
    await tx.invoice.update({ where: { id: payable.invoiceId }, data: { status: 'PAID' } })
  } else if (status === 'PARTIALLY_PAID') {
    await tx.invoice.update({ where: { id: payable.invoiceId }, data: { status: 'PARTIALLY_PAID' } })
  }

  return updated
}
