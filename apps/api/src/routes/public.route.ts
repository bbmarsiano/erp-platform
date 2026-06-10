import { prisma } from '@dflow/db'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'

const publicRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get(
    '/public/tenant-info',
    {
      schema: {
        tags: ['Public'],
        summary: 'Публична информация за инсталацията'
      }
    },
    async (_request, reply) => {
      const tenant = await prisma.tenant.findFirst({
        select: { name: true, logoUrl: true }
      })
      return reply.send({
        success: true,
        data: {
          name: tenant?.name || 'DFlowERP',
          logoUrl: tenant?.logoUrl || null
        }
      })
    }
  )
}

export default publicRoute
