import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { prisma } from '@dflow/db'
import { authenticate } from '@dflow/core'

const exportRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get(
    '/export/all',
    {
      schema: {
        tags: ['Export'],
        summary: 'Пълен експорт на данни за tenant'
      },
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const tenantId = request.user.tenantId

      const [
        tenant,
        users,
        warehouses,
        locations,
        products,
        stockItems,
        stockMovements,
        goodsReceipts,
        goodsReceiptLines,
        goodsIssues,
        goodsIssueLines,
        suppliers,
        purchaseOrders,
        purchaseOrderLines,
        deliveries,
        deliveryLines,
        boms,
        bomItems,
        workOrders,
        materialConsumptions,
        cashRegisters,
        sales,
        saleLines,
        backupPolicies,
        backupJobs
      ] = await Promise.all([
        prisma.tenant.findUnique({ where: { id: tenantId } }),
        prisma.user.findMany({
          where: { tenantId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true
          }
        }),
        prisma.warehouse.findMany({ where: { tenantId } }),
        prisma.location.findMany({ where: { warehouse: { tenantId } } }),
        prisma.product.findMany({ where: { tenantId } }),
        prisma.stockItem.findMany({ where: { tenantId } }),
        prisma.stockMovement.findMany({ where: { tenantId } }),
        prisma.goodsReceipt.findMany({ where: { tenantId } }),
        prisma.goodsReceiptLine.findMany({ where: { receipt: { tenantId } } }),
        prisma.goodsIssue.findMany({ where: { tenantId } }),
        prisma.goodsIssueLine.findMany({ where: { issue: { tenantId } } }),
        prisma.supplier.findMany({ where: { tenantId } }),
        prisma.purchaseOrder.findMany({ where: { tenantId } }),
        prisma.purchaseOrderLine.findMany({ where: { purchaseOrder: { tenantId } } }),
        prisma.delivery.findMany({ where: { tenantId } }),
        prisma.deliveryLine.findMany({ where: { delivery: { tenantId } } }),
        prisma.billOfMaterials.findMany({ where: { tenantId } }),
        prisma.bomItem.findMany({ where: { bom: { tenantId } } }),
        prisma.workOrder.findMany({ where: { tenantId } }),
        prisma.materialConsumption.findMany({ where: { workOrder: { tenantId } } }),
        prisma.cashRegister.findMany({ where: { tenantId } }),
        prisma.sale.findMany({ where: { tenantId } }),
        prisma.saleLine.findMany({ where: { sale: { tenantId } } }),
        prisma.backupPolicy.findMany({ where: { tenantId } }),
        prisma.backupJob.findMany({ where: { tenantId } })
      ])

      const serializedBackupJobs = backupJobs.map((job) => ({
        ...job,
        sizeBytes: job.sizeBytes != null ? job.sizeBytes.toString() : null
      }))

      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '0.5.1',
        format: 'DFlowERP-Export-v1',
        tenant: {
          name: tenant?.name,
          slug: tenant?.slug,
          eik: tenant?.eik,
          vatNumber: tenant?.vatNumber,
          address: tenant?.address,
          city: tenant?.city,
          country: tenant?.country,
          phone: tenant?.phone,
          email: tenant?.email
        },
        data: {
          users,
          warehouses,
          locations,
          products,
          stockItems,
          stockMovements,
          goodsReceipts,
          goodsReceiptLines,
          goodsIssues,
          goodsIssueLines,
          suppliers,
          purchaseOrders,
          purchaseOrderLines,
          deliveries,
          deliveryLines,
          billsOfMaterials: boms,
          bomItems,
          workOrders,
          materialConsumptions,
          cashRegisters,
          sales,
          saleLines,
          backupPolicies,
          backupJobs: serializedBackupJobs
        },
        counts: {
          users: users.length,
          warehouses: warehouses.length,
          locations: locations.length,
          products: products.length,
          stockItems: stockItems.length,
          stockMovements: stockMovements.length,
          goodsReceipts: goodsReceipts.length,
          goodsIssues: goodsIssues.length,
          suppliers: suppliers.length,
          purchaseOrders: purchaseOrders.length,
          deliveries: deliveries.length,
          billsOfMaterials: boms.length,
          workOrders: workOrders.length,
          sales: sales.length
        }
      }

      return reply.send({ success: true, data: exportData })
    }
  )
}

export default exportRoute
