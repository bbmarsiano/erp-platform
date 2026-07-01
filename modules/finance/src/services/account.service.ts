import type { Prisma } from '@prisma/client'

export async function getAccountByCode(tx: Prisma.TransactionClient, tenantId: string, code: string) {
  const account = await tx.chartOfAccount.findFirst({
    where: { tenantId, code, isActive: true }
  })
  if (!account) {
    throw new Error(`MISSING_ACCOUNT:${code}`)
  }
  return account
}
