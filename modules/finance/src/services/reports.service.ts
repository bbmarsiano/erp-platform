import { prisma } from '@dflow/db'
import { Decimal } from '@prisma/client/runtime/library'

function periodFilter(year?: number, month?: number) {
  if (!year) return {}
  if (month) {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 1)
    return { entryDate: { gte: start, lt: end } }
  }
  const start = new Date(year, 0, 1)
  const end = new Date(year + 1, 0, 1)
  return { entryDate: { gte: start, lt: end } }
}

function asOfFilter(date?: string) {
  if (!date) return { entryDate: { lte: new Date() } }
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return { entryDate: { lte: end } }
}

async function aggregateLines(
  tenantId: string,
  journalWhere: Record<string, unknown>
) {
  const lines = await prisma.journalEntryLine.findMany({
    where: {
      journalEntry: { tenantId, ...journalWhere }
    },
    include: { account: true }
  })

  const byAccount = new Map<
    string,
    { accountCode: string; accountName: string; accountType: string; totalDebit: Decimal; totalCredit: Decimal }
  >()

  for (const line of lines) {
    const key = line.accountId
    const existing = byAccount.get(key) ?? {
      accountCode: line.account.code,
      accountName: line.account.name,
      accountType: line.account.accountType,
      totalDebit: new Decimal(0),
      totalCredit: new Decimal(0)
    }
    existing.totalDebit = existing.totalDebit.add(line.debit)
    existing.totalCredit = existing.totalCredit.add(line.credit)
    byAccount.set(key, existing)
  }

  return [...byAccount.values()].sort((a, b) => a.accountCode.localeCompare(b.accountCode))
}

function toNum(d: Decimal) {
  return Number(d)
}

export async function getTrialBalance(tenantId: string, year?: number, month?: number) {
  const rows = await aggregateLines(tenantId, periodFilter(year, month))
  const accounts = rows.map((r) => {
    const debit = toNum(r.totalDebit)
    const credit = toNum(r.totalCredit)
    return {
      accountCode: r.accountCode,
      accountName: r.accountName,
      accountType: r.accountType,
      totalDebit: debit,
      totalCredit: credit,
      balance: debit - credit
    }
  })

  const totalDebit = accounts.reduce((s, a) => s + a.totalDebit, 0)
  const totalCredit = accounts.reduce((s, a) => s + a.totalCredit, 0)

  return { accounts, totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 }
}

export async function getIncomeStatement(tenantId: string, year?: number, month?: number) {
  const rows = await aggregateLines(tenantId, periodFilter(year, month))

  const revenues = rows
    .filter((r) => r.accountType === 'REVENUE')
    .map((r) => ({
      accountCode: r.accountCode,
      accountName: r.accountName,
      amount: toNum(r.totalCredit.sub(r.totalDebit))
    }))
    .filter((r) => r.amount !== 0)

  const expenses = rows
    .filter((r) => r.accountType === 'EXPENSE')
    .map((r) => ({
      accountCode: r.accountCode,
      accountName: r.accountName,
      amount: toNum(r.totalDebit.sub(r.totalCredit))
    }))
    .filter((r) => r.amount !== 0)

  const revenueTotal = revenues.reduce((s, r) => s + r.amount, 0)
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0)

  return {
    revenues,
    expenses,
    revenueTotal,
    expenseTotal,
    netResult: revenueTotal - expenseTotal
  }
}

export async function getBalanceSheet(tenantId: string, date?: string) {
  const rows = await aggregateLines(tenantId, asOfFilter(date))

  const assets = rows
    .filter((r) => r.accountType === 'ASSET')
    .map((r) => ({
      accountCode: r.accountCode,
      accountName: r.accountName,
      amount: toNum(r.totalDebit.sub(r.totalCredit))
    }))
    .filter((r) => r.amount !== 0)

  const liabilities = rows
    .filter((r) => r.accountType === 'LIABILITY')
    .map((r) => ({
      accountCode: r.accountCode,
      accountName: r.accountName,
      amount: toNum(r.totalCredit.sub(r.totalDebit))
    }))
    .filter((r) => r.amount !== 0)

  const assetsTotal = assets.reduce((s, a) => s + a.amount, 0)
  const liabilitiesTotal = liabilities.reduce((s, l) => s + l.amount, 0)
  const equity = assetsTotal - liabilitiesTotal

  return {
    asOf: date ?? new Date().toISOString().slice(0, 10),
    assets,
    liabilities,
    assetsTotal,
    liabilitiesTotal,
    equity,
    difference: assetsTotal - (liabilitiesTotal + equity),
    isBalanced: Math.abs(assetsTotal - (liabilitiesTotal + equity)) < 0.01
  }
}
