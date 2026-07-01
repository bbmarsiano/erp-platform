import { prisma } from '@dflow/db'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { createErrorResponse } from '../utils/api.utils.js'

export const requireTenantModule =
  (moduleId: string) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: request.user.tenantId },
      select: { enabledModules: true }
    })

    if (!tenant?.enabledModules?.includes(moduleId)) {
      return reply
        .status(403)
        .send(createErrorResponse('Модулът не е активиран за тази фирма', 'MODULE_DISABLED', 403))
    }
  }
