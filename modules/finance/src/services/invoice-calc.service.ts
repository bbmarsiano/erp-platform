import { Decimal } from '@prisma/client/runtime/library'

export interface InvoiceLineInput {
  description: string
  quantity: number
  unitPrice: number
  vatRate?: number
  productId?: string | null
}

export function calculateInvoiceTotals(lines: InvoiceLineInput[], invoiceVatRate = 20) {
  let subtotal = new Decimal(0)

  const computedLines = lines.map((line) => {
    const qty = new Decimal(line.quantity)
    const price = new Decimal(line.unitPrice)
    const lineTotal = qty.mul(price)
    subtotal = subtotal.add(lineTotal)
    return {
      ...line,
      vatRate: line.vatRate ?? invoiceVatRate,
      lineTotal
    }
  })

  const vatRate = new Decimal(invoiceVatRate)
  const vatAmount = subtotal.mul(vatRate).div(100)
  const totalAmount = subtotal.add(vatAmount)

  return { subtotal, vatAmount, totalAmount, vatRate, lines: computedLines }
}
