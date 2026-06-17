import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { authenticate } from '../middleware/authenticate'
import { validateLicense } from '../services/license.service'

const licenseRoute: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get(
    '/license/info',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['License'],
        summary: 'Get current installation license info'
      }
    },
    async (_request, reply) => {
      const licenseKey = process.env.LICENSE_KEY
      const licenseServerUrl = process.env.LICENSE_SERVER_URL
      const licenseServerKey = process.env.LICENSE_SERVER_KEY || ''

      if (!licenseKey || !licenseServerUrl) {
        return reply.send({ success: true, data: null })
      }

      try {
        const result = await validateLicense(licenseKey, licenseServerUrl, licenseServerKey)
        return reply.send({
          success: true,
          data: {
            ...result,
            key: licenseKey
          }
        })
      } catch {
        return reply.send({ success: false, data: null })
      }
    }
  )
}

export default licenseRoute
