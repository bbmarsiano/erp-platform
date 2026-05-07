import { createErrorResponse, createSuccessResponse } from '@dflow/core'
import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../../../../apps/api/src/middleware/authenticate'

const issuesRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get(
    '/issues',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Списък експедиции',
        description: 'Връща всички документи за изписване'
      }
    },
    async (request) =>
      createSuccessResponse(
        await prisma.goodsIssue.findMany({
          where: { tenantId: request.user.tenantId },
          orderBy: { createdAt: 'desc' }
        })
      )
  )

  fastify.post(
    '/issues',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Създаване експедиция',
        description: 'Създава чернова на изписване'
      }
    },
    async (request) => {
      const body = request.body as { warehouseId: string; destination?: string; note?: string }

      // Auto-generate issueNo: format ISS-YYYYMMDD-XXXX (sequential per tenant)
      const today = new Date()
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')

      // Count existing issues today for this tenant to get sequence
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const count = await prisma.goodsIssue.count({
        where: {
          tenantId: request.user.tenantId,
          createdAt: { gte: todayStart }
        }
      })
      const seq = String(count + 1).padStart(4, '0')
      const issueNo = `ISS-${dateStr}-${seq}`

      const created = await prisma.goodsIssue.create({
        data: {
          tenantId: request.user.tenantId,
          issueNo,
          warehouseId: body.warehouseId,
          destination: body.destination,
          note: body.note,
          createdBy: request.user.id
        }
      })
      return createSuccessResponse(created)
    }
  )

  fastify.get(
    '/issues/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Детайли експедиция',
        description: 'Връща документ за изписване с редове'
      }
    },
    async (request, reply) => {
      const params = request.params as { id: string }
      const issue = await prisma.goodsIssue.findFirst({
        where: { id: params.id, tenantId: request.user.tenantId },
        include: { lines: true }
      })
      if (!issue) {
        return reply.status(404).send(createErrorResponse('Issue not found', 'ISSUE_NOT_FOUND', 404))
      }
      return createSuccessResponse(issue)
    }
  )

  fastify.put(
    '/issues/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Редакция експедиция',
        description: 'Редактира чернова на изписване'
      }
    },
    async (request, reply) => {
      const params = request.params as { id: string }
      const body = request.body as {
        destination?: string
        note?: string
        lines?: Array<{ productId: string; locationId: string; quantity: number; lotNumber?: string }>
      }

      const issue = await prisma.goodsIssue.findFirst({
        where: { id: params.id, tenantId: request.user.tenantId }
      })
      if (!issue) {
        return reply.status(404).send(createErrorResponse('Issue not found', 'ISSUE_NOT_FOUND', 404))
      }
      if (issue.status !== 'DRAFT') {
        return reply.status(400).send(createErrorResponse('Only draft issues can be edited', 'INVALID_STATUS', 400))
      }

      const updated = await prisma.$transaction(async (tx) => {
        const issueUpdate = await tx.goodsIssue.update({
          where: { id: params.id },
          data: {
            destination: body.destination,
            note: body.note
          }
        })
        if (body.lines) {
          await tx.goodsIssueLine.deleteMany({ where: { issueId: params.id } })
          await tx.goodsIssueLine.createMany({
            data: body.lines.map((line) => ({
              issueId: params.id,
              productId: line.productId,
              locationId: line.locationId,
              quantity: line.quantity,
              lotNumber: line.lotNumber
            }))
          })
        }
        return issueUpdate
      })

      return createSuccessResponse(updated)
    }
  )

  fastify.post(
    '/issues/:id/confirm',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Потвърждаване експедиция',
        description: 'Проверява наличност, намалява количества и създава OUT движения'
      }
    },
    async (request, reply) => {
      const params = request.params as { id: string }
      try {
        const result = await prisma.$transaction(async (tx) => {
          const issue = await tx.goodsIssue.findFirst({
            where: { id: params.id, tenantId: request.user.tenantId },
            include: { lines: true }
          })
          if (!issue) {
            throw new Error('ISSUE_NOT_FOUND')
          }
          if (issue.status !== 'DRAFT') {
            throw new Error('ISSUE_NOT_DRAFT')
          }

          for (const line of issue.lines) {
            const stockItem = await tx.stockItem.findUnique({
              where: {
                productId_locationId_lotNumber: {
                  productId: line.productId,
                  locationId: line.locationId,
                  lotNumber: line.lotNumber ?? null
                }
              }
            })
            if (!stockItem || stockItem.quantity < line.quantity) {
              throw new Error('INSUFFICIENT_STOCK')
            }

            await tx.stockItem.update({
              where: { id: stockItem.id },
              data: { quantity: { decrement: line.quantity } }
            })

            await tx.stockMovement.create({
              data: {
                tenantId: request.user.tenantId,
                productId: line.productId,
                movementType: 'OUT',
                quantity: line.quantity,
                fromLocationId: line.locationId,
                referenceType: 'ISSUE',
                referenceId: issue.id,
                lotNumber: line.lotNumber,
                createdBy: request.user.id
              }
            })
          }

          return tx.goodsIssue.update({
            where: { id: issue.id },
            data: { status: 'CONFIRMED' }
          })
        })

        return createSuccessResponse(result)
      } catch (error) {
        const message = (error as Error).message
        if (message === 'ISSUE_NOT_FOUND') {
          return reply.status(404).send(createErrorResponse('Issue not found', 'ISSUE_NOT_FOUND', 404))
        }
        if (message === 'ISSUE_NOT_DRAFT') {
          return reply.status(400).send(createErrorResponse('Issue already processed', 'INVALID_STATUS', 400))
        }
        if (message === 'INSUFFICIENT_STOCK') {
          return reply.status(400).send(createErrorResponse('Insufficient stock', 'INSUFFICIENT_STOCK', 400))
        }
        throw error
      }
    }
  )

  fastify.post(
    '/issues/:id/cancel',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['WMS'],
        summary: 'Отказ експедиция',
        description: 'Анулира документ за изписване'
      }
    },
    async (request, reply) => {
      const params = request.params as { id: string }
      const updated = await prisma.goodsIssue.updateMany({
        where: { id: params.id, tenantId: request.user.tenantId, status: 'DRAFT' },
        data: { status: 'CANCELLED' }
      })
      if (!updated.count) {
        return reply.status(400).send(createErrorResponse('Only draft issues can be cancelled', 'INVALID_STATUS', 400))
      }
      return createSuccessResponse({ cancelled: true })
    }
  )
}

export default issuesRoute
