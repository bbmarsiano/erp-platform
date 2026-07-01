import type { Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { getNextDocumentNumberInTx } from './document-numbering.service'
import { calculateInvoiceTotals } from './invoice-calc.service'
import { createJournalEntry, type JournalLineInput } from './journal.service'
import { assertPeriodOpen, PeriodClosedError } from './period.service'

const DEFAULT_VAT_RATE = 20

export class FinanceAutomationError extends Error {
  constructor(
    technicalMessage: string,
    public readonly userMessage: string,
    public readonly code: string
  ) {
    super(technicalMessage)
    this.name = 'FinanceAutomationError'
  }
}

export const POS_SALE_CANCELLED_MESSAGE =
  'Продажбата не беше завършена. Възникна грешка при създаване на счетоводен запис, затова цялата операция беше отменена и наличностите НЕ бяха променени. Моля опитайте отново или се свържете с поддръжка.'

export const SCM_DELIVERY_CANCELLED_MESSAGE =
  'Доставката не беше потвърдена. Възникна грешка при създаване на счетоводен запис, затова цялата операция беше отменена и наличностите НЕ бяха променени. Моля опитайте отново или се свържете с поддръжка.'

function isFinishedGood(product: { bom?: unknown | null; category?: string | null }): boolean {
  if (product.bom) return true
  const category = (product.category ?? '').toLowerCase()
  return category.includes('продукция') || category.includes('production') || category.includes('finished')
}

async function getAccountByCode(tx: Prisma.TransactionClient, tenantId: string, code: string) {
  const account = await tx.chartOfAccount.findFirst({
    where: { tenantId, code, isActive: true }
  })
  if (!account) {
    throw new FinanceAutomationError(
      `Chart of account ${code} not found for tenant ${tenantId}`,
      `Липсва сметка ${code} в сметкоплана. Добавете я във Финанси → Сметкоплан и опитайте отново.`,
      'MISSING_CHART_ACCOUNT'
    )
  }
  return account
}

function wrapAutomationError(error: unknown, userMessage: string): never {
  if (error instanceof FinanceAutomationError) throw error
  if (error instanceof PeriodClosedError) {
    throw new FinanceAutomationError(error.message, error.userMessage, 'PERIOD_CLOSED')
  }
  const technical = error instanceof Error ? error.message : String(error)
  throw new FinanceAutomationError(technical, userMessage, 'FINANCE_AUTOMATION_FAILED')
}

function addAmount(map: Map<string, Decimal>, key: string, amount: Decimal) {
  map.set(key, (map.get(key) ?? new Decimal(0)).add(amount))
}

function mapToJournalLines(amounts: Map<string, Decimal>, side: 'debit' | 'credit', description?: string): JournalLineInput[] {
  return [...amounts.entries()]
    .filter(([, amount]) => !amount.equals(0))
    .map(([accountId, amount]) => ({
      accountId,
      [side]: amount,
      description
    }))
}

export async function onPosSaleCompleted(
  tx: Prisma.TransactionClient,
  opts: { saleId: string; userId: string; tenantId: string }
): Promise<{ draftInvoiceId?: string }> {
  try {
    const sale = await tx.sale.findFirst({
      where: { id: opts.saleId, tenantId: opts.tenantId },
      include: {
        lines: {
          include: {
            product: { include: { bom: { select: { id: true } } } }
          }
        }
      }
    })
    if (!sale) {
      throw new FinanceAutomationError('Sale not found', POS_SALE_CANCELLED_MESSAGE, 'SALE_NOT_FOUND')
    }

    const tenant = await tx.tenant.findUnique({
      where: { id: opts.tenantId },
      select: { vatRegistered: true }
    })

    const totalGross = new Decimal(sale.totalAmount)
    const vatRate = DEFAULT_VAT_RATE
    const vatFactor = new Decimal(1).add(new Decimal(vatRate).div(100))

    const revenueByAccount = new Map<string, Decimal>()
    let vatAmount = new Decimal(0)

    for (const line of sale.lines) {
      const lineGross = new Decimal(line.quantity).mul(line.unitPrice)
      const revenueCode = isFinishedGood(line.product) ? '703' : '702'
      const revenueAccount = await getAccountByCode(tx, opts.tenantId, revenueCode)

      if (tenant?.vatRegistered) {
        const lineNet = lineGross.div(vatFactor)
        const lineVat = lineGross.sub(lineNet)
        addAmount(revenueByAccount, revenueAccount.id, lineNet)
        vatAmount = vatAmount.add(lineVat)
      } else {
        addAmount(revenueByAccount, revenueAccount.id, lineGross)
      }
    }

    const paymentCode = sale.paymentMethod === 'CASH' ? '501' : '503'
    const paymentAccount = await getAccountByCode(tx, opts.tenantId, paymentCode)

    const journalLines: JournalLineInput[] = [
      { accountId: paymentAccount.id, debit: totalGross, description: `Продажба ${sale.saleNo}` },
      ...mapToJournalLines(revenueByAccount, 'credit', `Приходи ${sale.saleNo}`)
    ]

    if (tenant?.vatRegistered && !vatAmount.equals(0)) {
      const vatAccount = await getAccountByCode(tx, opts.tenantId, '4538')
      journalLines.push({ accountId: vatAccount.id, credit: vatAmount, description: `ДДС ${sale.saleNo}` })
    }

    await assertPeriodOpen(opts.tenantId, sale.createdAt, tx)

    await createJournalEntry(tx, {
      tenantId: opts.tenantId,
      entryDate: sale.createdAt,
      description: `Продажба ${sale.saleNo}`,
      sourceType: 'POS_SALE',
      sourceId: sale.id,
      createdBy: opts.userId,
      lines: journalLines
    })

    if (!sale.customerId) {
      return {}
    }

    const invoiceLines = sale.lines.map((line) => ({
      productId: line.productId,
      description: `${line.product.code} — ${line.product.name}`,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      vatRate: DEFAULT_VAT_RATE
    }))

    const totals = calculateInvoiceTotals(invoiceLines, DEFAULT_VAT_RATE)
    const number = await getNextDocumentNumberInTx(tx, opts.tenantId, 'INVOICE_OUT')

    const invoice = await tx.invoice.create({
      data: {
        tenantId: opts.tenantId,
        docType: 'INVOICE_OUT',
        number,
        issueDate: sale.createdAt,
        dueDate: null,
        customerId: sale.customerId,
        currency: 'BGN',
        subtotal: totals.subtotal,
        vatAmount: totals.vatAmount,
        totalAmount: totals.totalAmount,
        vatRate: totals.vatRate,
        status: 'DRAFT',
        note: `Автоматично от продажба ${sale.saleNo}`,
        relatedSaleId: sale.id,
        createdBy: opts.userId,
        lines: {
          create: totals.lines.map((line) => ({
            productId: line.productId ?? null,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            vatRate: line.vatRate,
            lineTotal: line.lineTotal
          }))
        }
      }
    })

    return { draftInvoiceId: invoice.id }
  } catch (error) {
    wrapAutomationError(error, POS_SALE_CANCELLED_MESSAGE)
  }
}

export async function onScmDeliveryConfirmed(
  tx: Prisma.TransactionClient,
  opts: { deliveryId: string; userId: string; tenantId: string }
): Promise<{ draftInvoiceId?: string }> {
  try {
    const delivery = await tx.delivery.findFirst({
      where: { id: opts.deliveryId, tenantId: opts.tenantId },
      include: {
        lines: true,
        purchaseOrder: { include: { lines: true, supplier: true } }
      }
    })
    if (!delivery) {
      throw new FinanceAutomationError('Delivery not found', SCM_DELIVERY_CANCELLED_MESSAGE, 'DELIVERY_NOT_FOUND')
    }
    if (!delivery.purchaseOrder?.supplierId) {
      throw new FinanceAutomationError(
        'Delivery has no supplier',
        SCM_DELIVERY_CANCELLED_MESSAGE,
        'SUPPLIER_REQUIRED'
      )
    }

    const poLineByProduct = new Map(delivery.purchaseOrder.lines.map((line) => [line.productId, line]))
    const stockByAccount = new Map<string, Decimal>()
    const invoiceLineInputs: Array<{
      productId: string
      description: string
      quantity: number
      unitPrice: number
      vatRate: number
    }> = []

    let deliveryTotal = new Decimal(0)

    for (const line of delivery.lines) {
      const poLine = poLineByProduct.get(line.productId)
      if (!poLine) continue

      const product = await tx.product.findFirst({
        where: { id: line.productId, tenantId: opts.tenantId },
        include: { bom: { select: { id: true } } }
      })
      if (!product) continue

      const unitPrice = Number(poLine.unitPrice)
      const lineTotal = new Decimal(line.quantity).mul(unitPrice)
      deliveryTotal = deliveryTotal.add(lineTotal)

      const stockCode = isFinishedGood(product) ? '304' : '302'
      const stockAccount = await getAccountByCode(tx, opts.tenantId, stockCode)
      addAmount(stockByAccount, stockAccount.id, lineTotal)

      invoiceLineInputs.push({
        productId: product.id,
        description: `${product.code} — ${product.name}`,
        quantity: line.quantity,
        unitPrice,
        vatRate: DEFAULT_VAT_RATE
      })
    }

    if (deliveryTotal.equals(0) || invoiceLineInputs.length === 0) {
      throw new FinanceAutomationError(
        'Delivery has no valued lines',
        SCM_DELIVERY_CANCELLED_MESSAGE,
        'EMPTY_DELIVERY'
      )
    }

    const supplierAccount = await getAccountByCode(tx, opts.tenantId, '401')

    const entryDate = new Date()
    await assertPeriodOpen(opts.tenantId, entryDate, tx)

    await createJournalEntry(tx, {
      tenantId: opts.tenantId,
      entryDate,
      description: `Доставка ${delivery.deliveryNo}`,
      sourceType: 'SCM_DELIVERY',
      sourceId: delivery.id,
      createdBy: opts.userId,
      lines: [
        ...mapToJournalLines(stockByAccount, 'debit', `Доставка ${delivery.deliveryNo}`),
        { accountId: supplierAccount.id, credit: deliveryTotal, description: `Доставчик ${delivery.deliveryNo}` }
      ]
    })

    const totals = calculateInvoiceTotals(invoiceLineInputs, DEFAULT_VAT_RATE)
    const number = await getNextDocumentNumberInTx(tx, opts.tenantId, 'INVOICE_IN')

    const invoice = await tx.invoice.create({
      data: {
        tenantId: opts.tenantId,
        docType: 'INVOICE_IN',
        number,
        issueDate: new Date(),
        dueDate: null,
        supplierId: delivery.purchaseOrder.supplierId,
        currency: 'BGN',
        subtotal: totals.subtotal,
        vatAmount: totals.vatAmount,
        totalAmount: totals.totalAmount,
        vatRate: totals.vatRate,
        status: 'DRAFT',
        note: `Автоматично от доставка ${delivery.deliveryNo}`,
        relatedPOId: delivery.purchaseOrderId,
        createdBy: opts.userId,
        lines: {
          create: totals.lines.map((line) => ({
            productId: line.productId ?? null,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            vatRate: line.vatRate,
            lineTotal: line.lineTotal
          }))
        }
      }
    })

    return { draftInvoiceId: invoice.id }
  } catch (error) {
    wrapAutomationError(error, SCM_DELIVERY_CANCELLED_MESSAGE)
  }
}

export function isFinanceModuleEnabled(enabledModules: string[] | null | undefined): boolean {
  if (!enabledModules || enabledModules.length === 0) return true
  return enabledModules.includes('finance')
}
