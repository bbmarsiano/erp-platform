import { prisma } from '@dflow/db'

export const listDeliveries = (tenantId: string) =>
  prisma.delivery.findMany({
    where: { tenantId },
    include: { purchaseOrder: true, warehouse: true },
    orderBy: { createdAt: 'desc' }
  })

