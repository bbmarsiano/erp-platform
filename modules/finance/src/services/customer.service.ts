import { prisma } from '@dflow/db'

export async function listCustomers(tenantId: string, search?: string, isActive?: boolean) {
  const term = search?.trim()
  return prisma.customer.findMany({
    where: {
      tenantId,
      ...(isActive !== undefined ? { isActive } : {}),
      ...(term
        ? {
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { code: { contains: term, mode: 'insensitive' } },
              { eik: { contains: term, mode: 'insensitive' } }
            ]
          }
        : {})
    },
    orderBy: { code: 'asc' }
  })
}
