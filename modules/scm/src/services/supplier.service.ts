import { prisma } from '@dflow/db'

export const listSuppliers = (tenantId: string, isActive?: boolean) =>
  prisma.supplier.findMany({
    where: { tenantId, ...(typeof isActive === 'boolean' ? { isActive } : {}) },
    orderBy: { code: 'asc' }
  })

