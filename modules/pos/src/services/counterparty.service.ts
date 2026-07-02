import { prisma } from '@dflow/db'

export async function listCounterparties(tenantId: string, search?: string, isActive = true) {
  return prisma.customer.findMany({
    where: {
      tenantId,
      isActive,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
              { eik: { contains: search, mode: 'insensitive' } }
            ]
          }
        : {})
    },
    orderBy: { name: 'asc' }
  })
}

export async function nextCounterpartyCode(tenantId: string): Promise<string> {
  const count = await prisma.customer.count({ where: { tenantId } })
  return `KON-${String(count + 1).padStart(3, '0')}`
}
