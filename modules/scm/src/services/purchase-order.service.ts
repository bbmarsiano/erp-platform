import { prisma } from '@dflow/db'

export const listPurchaseOrders = (tenantId: string, filters: { status?: string; supplierId?: string }) =>
  prisma.purchaseOrder.findMany({
    where: {
      tenantId,
      ...(filters.status ? { status: filters.status as any } : {}),
      ...(filters.supplierId ? { supplierId: filters.supplierId } : {})
    },
    include: { supplier: true, warehouse: true },
    orderBy: { createdAt: 'desc' }
  })

