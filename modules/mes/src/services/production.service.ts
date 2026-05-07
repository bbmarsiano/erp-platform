import { prisma } from '@dflow/db'

export const listWorkOrders = (tenantId: string, status?: string) =>
  prisma.workOrder.findMany({
    where: { tenantId, ...(status ? { status: status as any } : {}) },
    include: { product: true, outputLocation: true },
    orderBy: { createdAt: 'desc' }
  })

