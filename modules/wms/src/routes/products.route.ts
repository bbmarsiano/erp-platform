import { authenticate } from '@dflow/core'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { prisma } from '@dflow/db'

const productsRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get(
    '/products',
    {
      schema: { tags: ['WMS'], summary: 'Списък продукти' },
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const products = await prisma.product.findMany({
        where: { tenantId: request.user.tenantId },
        include: {
          stockItems: true,
          _count: { select: { stockItems: true } }
        },
        orderBy: { code: 'asc' }
      })
      return reply.send({ success: true, data: products })
    }
  )

  fastify.post(
    '/products',
    {
      schema: {
        tags: ['WMS'],
        summary: 'Създай продукт',
        body: {
          type: 'object',
          required: ['code', 'name', 'unit'],
          properties: {
            code: { type: 'string' },
            name: { type: 'string' },
            unit: { type: 'string' },
            barcode: { type: 'string' },
            minStock: { type: 'number' },
            price: { type: 'number' },
            description: { type: 'string' },
            initialStock: { type: 'number' },
            warehouseId: { type: 'string' },
            locationId: { type: 'string' }
          }
        }
      },
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const body = request.body as {
        code: string
        name: string
        unit: string
        barcode?: string
        minStock?: number
        price?: number
        description?: string
        initialStock?: number
        warehouseId?: string
        locationId?: string
      }

      const existing = await prisma.product.findFirst({
        where: { code: body.code.trim().toUpperCase(), tenantId: request.user.tenantId }
      })
      if (existing) {
        return reply.status(409).send({
          success: false,
          error: `Продукт с код ${body.code} вече съществува`
        })
      }

      if (body.barcode) {
        const existingBarcode = await prisma.product.findFirst({
          where: { barcode: body.barcode.trim(), tenantId: request.user.tenantId }
        })
        if (existingBarcode) {
          return reply.status(409).send({
            success: false,
            error: `Баркодът вече се използва от: ${existingBarcode.name}`
          })
        }
      }

      const product = await prisma.product.create({
        data: {
          tenantId: request.user.tenantId,
          code: body.code.trim().toUpperCase(),
          name: body.name.trim(),
          unit: body.unit.trim(),
          barcode: body.barcode?.trim() || null,
          minStock: body.minStock ?? 0,
          price: body.price ?? null,
          description: body.description?.trim() || null,
          isActive: true
        }
      })

      await prisma.auditLog.create({
        data: {
          tenantId: request.user.tenantId,
          userId: request.user.id,
          action: 'CREATE_PRODUCT',
          entity: 'Product',
          entityId: product.id,
          payload: { code: product.code, name: product.name }
        }
      })

      if (body.initialStock && body.initialStock > 0) {
        if (!body.warehouseId) {
          return reply.status(400).send({
            success: false,
            error: 'Изберете склад за началната наличност'
          })
        }

        const warehouse = await prisma.warehouse.findFirst({
          where: { id: body.warehouseId, tenantId: request.user.tenantId, isActive: true }
        })
        if (!warehouse) {
          return reply.status(400).send({ success: false, error: 'Складът не е намерен' })
        }

        const location = body.locationId
          ? await prisma.location.findFirst({
              where: { id: body.locationId, warehouseId: body.warehouseId, isActive: true }
            })
          : await prisma.location.findFirst({
              where: { warehouseId: body.warehouseId, isActive: true },
              orderBy: { code: 'asc' }
            })

        if (!location) {
          return reply.status(400).send({ success: false, error: 'Локацията не е намерена' })
        }

        const existing = await prisma.stockItem.findFirst({
            where: {
              tenantId: request.user.tenantId,
              productId: product.id,
              locationId: location.id,
              lotNumber: null
            }
          })

          if (existing) {
            await prisma.stockItem.update({
              where: { id: existing.id },
              data: { quantity: { increment: body.initialStock } }
            })
          } else {
            await prisma.stockItem.create({
              data: {
                tenantId: request.user.tenantId,
                productId: product.id,
                locationId: location.id,
                quantity: body.initialStock,
                lotNumber: null
              }
            })
          }

          await prisma.stockMovement.create({
            data: {
              tenantId: request.user.tenantId,
              productId: product.id,
              movementType: 'IN',
              quantity: body.initialStock,
              toLocationId: location.id,
              referenceType: 'INITIAL_STOCK',
              referenceId: product.id,
              note: 'Начална наличност при създаване на продукт',
              createdBy: request.user.id
            }
          })
      }

      return reply.status(201).send({ success: true, data: product })
    }
  )

  fastify.put(
    '/products/:id',
    {
      schema: { tags: ['WMS'], summary: 'Обнови продукт' },
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as Partial<{
        name: string
        unit: string
        barcode: string | null
        minStock: number
        price: number
        description: string
        isActive: boolean
        stockAdjustment: number
        warehouseId: string
      }>

      const owned = await prisma.product.findFirst({
        where: { id, tenantId: request.user.tenantId }
      })
      if (!owned) {
        return reply.status(404).send({ success: false, error: 'Продуктът не е намерен' })
      }

      if (body.barcode) {
        const existingBarcode = await prisma.product.findFirst({
          where: {
            barcode: body.barcode.trim(),
            tenantId: request.user.tenantId,
            NOT: { id }
          }
        })
        if (existingBarcode) {
          return reply.status(409).send({
            success: false,
            error: `Баркодът вече се използва от: ${existingBarcode.name}`
          })
        }
      }

      const product = await prisma.product.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: body.name.trim() }),
          ...(body.unit !== undefined && { unit: body.unit.trim() }),
          ...(body.barcode !== undefined && { barcode: body.barcode?.trim() || null }),
          ...(body.minStock !== undefined && { minStock: body.minStock }),
          ...(body.price !== undefined && { price: body.price }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.isActive !== undefined && { isActive: body.isActive })
        }
      })

      if (body.stockAdjustment && body.stockAdjustment !== 0 && body.warehouseId) {
        const warehouse = await prisma.warehouse.findFirst({
          where: { id: body.warehouseId, tenantId: request.user.tenantId, isActive: true }
        })
        if (!warehouse) {
          return reply.status(400).send({ success: false, error: 'Складът не е намерен' })
        }

        const location = await prisma.location.findFirst({
          where: { warehouseId: body.warehouseId, isActive: true },
          orderBy: { code: 'asc' }
        })

        if (location) {
          const qty = Math.abs(body.stockAdjustment)
          const isIn = body.stockAdjustment > 0
          const movType = isIn ? 'IN' : 'OUT'

          const existing = await prisma.stockItem.findFirst({
            where: {
              tenantId: request.user.tenantId,
              productId: id,
              locationId: location.id,
              lotNumber: null
            }
          })

          if (!isIn) {
            if (!existing || existing.quantity < qty) {
              return reply.status(400).send({
                success: false,
                error: `Недостатъчна наличност за изваждане (налично: ${existing?.quantity ?? 0})`
              })
            }
            await prisma.stockItem.update({
              where: { id: existing.id },
              data: { quantity: { decrement: qty } }
            })
          } else if (existing) {
            await prisma.stockItem.update({
              where: { id: existing.id },
              data: { quantity: { increment: qty } }
            })
          } else {
            await prisma.stockItem.create({
              data: {
                tenantId: request.user.tenantId,
                productId: id,
                locationId: location.id,
                quantity: qty,
                lotNumber: null
              }
            })
          }

          await prisma.stockMovement.create({
            data: {
              tenantId: request.user.tenantId,
              productId: id,
              movementType: movType,
              quantity: qty,
              toLocationId: isIn ? location.id : undefined,
              fromLocationId: !isIn ? location.id : undefined,
              referenceType: 'ADJUSTMENT',
              referenceId: id,
              note: 'Ръчна корекция на наличност',
              createdBy: request.user.id
            }
          })
        }
      }

      return reply.send({ success: true, data: product })
    }
  )

  fastify.delete(
    '/products/:id',
    {
      schema: { tags: ['WMS'], summary: 'Деактивирай продукт' },
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }

      const owned = await prisma.product.findFirst({
        where: { id, tenantId: request.user.tenantId }
      })
      if (!owned) {
        return reply.status(404).send({ success: false, error: 'Продуктът не е намерен' })
      }

      const stockItems = await prisma.stockItem.findMany({ where: { productId: id } })
      const totalStock = stockItems.reduce((s, si) => s + si.quantity, 0)
      if (totalStock > 0) {
        return reply.status(400).send({
          success: false,
          error: `Не може да се деактивира — продуктът има наличност ${totalStock} бр.`
        })
      }

      await prisma.product.update({ where: { id }, data: { isActive: false } })
      return reply.send({ success: true, message: 'Продуктът е деактивиран' })
    }
  )
}

export default productsRoute
