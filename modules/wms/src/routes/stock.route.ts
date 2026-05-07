import { createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../../../apps/api/src/middleware/authenticate'
import { listMovements } from '../services/movement.service'
import { listStock } from '../services/stock.service'

const stockRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get(
    '/stock/products',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Списък артикули',
        description: 'Списък с активни артикули за текущия наемател',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'array', items: { type: 'object', additionalProperties: true } }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const products = await prisma.product.findMany({
        where: { tenantId: request.user.tenantId, isActive: true },
        orderBy: { code: 'asc' }
      })
      return reply.send({ success: true, data: products })
    }
  )

  fastify.get(
    '/stock',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Текущи наличности',
        description: 'Показва наличности по продукт и локация с филтри'
      }
    },
    async (request) => {
      const query = request.query as {
        warehouseId?: string
        productId?: string
        lowStock?: string
      }
      const data = await listStock(request.user.tenantId, {
        warehouseId: query.warehouseId,
        productId: query.productId,
        lowStock: query.lowStock === 'true'
      })
      return createSuccessResponse(data)
    }
  )

  fastify.get(
    '/stock/movements',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'История на движения',
        description: 'Връща движенията по склад с филтри по период и тип'
      }
    },
    async (request) => {
      const query = request.query as {
        productId?: string
        type?: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT'
        dateFrom?: string
        dateTo?: string
      }
      const data = await listMovements(request.user.tenantId, query)
      return createSuccessResponse(data)
    }
  )

  fastify.post(
    '/stock/adjustment',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Корекция на наличност',
        description: 'Създава корекция и движение ADJUSTMENT'
      }
    },
    async (request) => {
      const body = request.body as {
        productId: string
        locationId: string
        quantityDelta: number
        lotNumber?: string
        note?: string
      }

      const result = await prisma.$transaction(async (tx) => {
        const stockItem = body.lotNumber
          ? await tx.stockItem.upsert({
              where: {
                productId_locationId_lotNumber: {
                  productId: body.productId,
                  locationId: body.locationId,
                  lotNumber: body.lotNumber
                }
              },
              update: {
                quantity: { increment: body.quantityDelta }
              },
              create: {
                tenantId: request.user.tenantId,
                productId: body.productId,
                locationId: body.locationId,
                quantity: body.quantityDelta,
                lotNumber: body.lotNumber
              }
            })
          : await (async () => {
              const existing = await tx.stockItem.findFirst({
                where: {
                  tenantId: request.user.tenantId,
                  productId: body.productId,
                  locationId: body.locationId,
                  lotNumber: null
                }
              })
              if (existing) {
                return tx.stockItem.update({
                  where: { id: existing.id },
                  data: { quantity: { increment: body.quantityDelta } }
                })
              }
              return tx.stockItem.create({
                data: {
                  tenantId: request.user.tenantId,
                  productId: body.productId,
                  locationId: body.locationId,
                  quantity: body.quantityDelta,
                  lotNumber: null
                }
              })
            })()

        const movement = await tx.stockMovement.create({
          data: {
            tenantId: request.user.tenantId,
            productId: body.productId,
            movementType: 'ADJUSTMENT',
            quantity: body.quantityDelta,
            toLocationId: body.locationId,
            referenceType: 'ADJUSTMENT',
            lotNumber: body.lotNumber,
            note: body.note,
            createdBy: request.user.id
          }
        })

        return { stockItem, movement }
      })

      return createSuccessResponse(result)
    }
  )
}

export default stockRoute
