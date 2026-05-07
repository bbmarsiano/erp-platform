import { prisma } from '@dflow/db'

export const listSales = (tenantId: string, filters: { date?: string; registerId?: string }) =>
  prisma.sale.findMany({
    where: {
      tenantId,
      ...(filters.registerId ? { cashRegisterId: filters.registerId } : {}),
      ...(filters.date
        ? {
            createdAt: {
              gte: new Date(`${filters.date}T00:00:00.000Z`),
              lt: new Date(`${filters.date}T23:59:59.999Z`)
            }
          }
        : {})
    },
    include: { cashRegister: true },
    orderBy: { createdAt: 'desc' }
  })

