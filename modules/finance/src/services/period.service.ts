import type { Prisma } from '@prisma/client'
import { prisma } from '@dflow/db'

export const MONTH_NAMES_BG = [
  'Януари',
  'Февруари',
  'Март',
  'Април',
  'Май',
  'Юни',
  'Юли',
  'Август',
  'Септември',
  'Октомври',
  'Ноември',
  'Декември'
]

export class PeriodClosedError extends Error {
  constructor(public readonly userMessage: string) {
    super(userMessage)
    this.name = 'PeriodClosedError'
  }
}

export function periodLabel(year: number, month: number): string {
  return `${MONTH_NAMES_BG[month - 1]} ${year}`
}

export function periodBounds(year: number, month: number) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)
  return { start, end }
}

function recentPeriodKeys(count = 13): Array<{ year: number; month: number }> {
  const now = new Date()
  const keys: Array<{ year: number; month: number }> = []
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push({ year: d.getFullYear(), month: d.getMonth() + 1 })
  }
  return keys
}

export async function ensureRecentPeriods(tenantId: string) {
  const keys = recentPeriodKeys(13)
  const existing = await prisma.financialPeriod.findMany({
    where: { tenantId },
    select: { year: true, month: true }
  })
  const existingSet = new Set(existing.map((p) => `${p.year}-${p.month}`))
  const missing = keys.filter((k) => !existingSet.has(`${k.year}-${k.month}`))

  if (missing.length) {
    await prisma.financialPeriod.createMany({
      data: missing.map((k) => ({
        tenantId,
        year: k.year,
        month: k.month,
        isClosed: false
      })),
      skipDuplicates: true
    })
  }
}

export async function assertPeriodOpen(
  tenantId: string,
  date: Date,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const client = tx ?? prisma
  const year = date.getFullYear()
  const month = date.getMonth() + 1

  const period = await client.financialPeriod.findUnique({
    where: { tenantId_year_month: { tenantId, year, month } }
  })

  if (period?.isClosed) {
    throw new PeriodClosedError(
      `Не може да се създаде документ в затворен счетоводен период (${month}/${year})`
    )
  }
}

export async function listFinancialPeriods(tenantId: string) {
  await ensureRecentPeriods(tenantId)

  const periods = await prisma.financialPeriod.findMany({
    where: { tenantId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }]
  })

  const closedByIds = [...new Set(periods.map((p) => p.closedBy).filter(Boolean))] as string[]
  const users =
    closedByIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: closedByIds } },
          select: { id: true, firstName: true, lastName: true }
        })
      : []
  const userMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`.trim()]))

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  return periods.map((p) => ({
    id: p.id,
    year: p.year,
    month: p.month,
    isClosed: p.isClosed,
    closedAt: p.closedAt,
    closedBy: p.closedBy,
    closedByName: p.closedBy ? (userMap.get(p.closedBy) ?? null) : null,
    periodLabel: periodLabel(p.year, p.month),
    isCurrent: p.year === currentYear && p.month === currentMonth
  }))
}

export async function closeFinancialPeriod(tenantId: string, year: number, month: number, userId: string) {
  const period = await prisma.financialPeriod.findUnique({
    where: { tenantId_year_month: { tenantId, year, month } }
  })

  if (!period) {
    await ensureRecentPeriods(tenantId)
    const created = await prisma.financialPeriod.findUnique({
      where: { tenantId_year_month: { tenantId, year, month } }
    })
    if (!created) {
      throw new Error(`Period ${month}/${year} could not be created`)
    }
    return closeFinancialPeriod(tenantId, year, month, userId)
  }

  if (period.isClosed) {
    throw new PeriodAlreadyClosedError()
  }

  const { start, end } = periodBounds(year, month)
  const draftCount = await prisma.invoice.count({
    where: {
      tenantId,
      status: 'DRAFT',
      issueDate: { gte: start, lt: end }
    }
  })

  if (draftCount > 0) {
    throw new DraftInvoicesInPeriodError()
  }

  return prisma.financialPeriod.update({
    where: { id: period.id },
    data: {
      isClosed: true,
      closedAt: new Date(),
      closedBy: userId
    }
  })
}

export class PeriodAlreadyClosedError extends Error {
  readonly userMessage = 'Периодът вече е затворен'
  constructor() {
    super('Периодът вече е затворен')
    this.name = 'PeriodAlreadyClosedError'
  }
}

export class DraftInvoicesInPeriodError extends Error {
  readonly userMessage =
    'Има незатворени чернови фактури за периода. Издайте или анулирайте ги преди затваряне.'
  constructor() {
    super('Има незатворени чернови фактури за периода. Издайте или анулирайте ги преди затваряне.')
    this.name = 'DraftInvoicesInPeriodError'
  }
}

export class PeriodNotFoundError extends Error {
  constructor() {
    super('Period not found')
    this.name = 'PeriodNotFoundError'
  }
}

export async function reopenFinancialPeriod(tenantId: string, year: number, month: number) {
  const period = await prisma.financialPeriod.findUnique({
    where: { tenantId_year_month: { tenantId, year, month } }
  })

  if (!period) {
    throw new PeriodNotFoundError()
  }

  if (!period.isClosed) {
    return period
  }

  console.warn(
    `[FINANCE] Period ${month}/${year} reopened for tenant ${tenantId} — audit: emergency reopen by SUPER_ADMIN`
  )

  return prisma.financialPeriod.update({
    where: { id: period.id },
    data: {
      isClosed: false,
      closedAt: null,
      closedBy: null
    }
  })
}
