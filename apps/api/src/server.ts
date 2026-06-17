import dotenv from 'dotenv'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import Fastify, { FastifyInstance } from 'fastify'
import helmet from '@fastify/helmet'
import sensible from '@fastify/sensible'
import fastifyStatic from '@fastify/static'
import corsPlugin from './plugins/cors'
import jwtPlugin from './plugins/jwt'
import moduleLoaderPlugin from './plugins/moduleLoader'
import swaggerPlugin from './plugins/swagger'
import healthRoute from './routes/health.route'
import publicRoute from './routes/public.route'
import authRoute from './routes/auth.route'
import usersRoute from './routes/users.route'
import licenseRoute from './routes/license.route'
import { validateLicense } from './services/license.service'

dotenv.config({ path: '../../.env' })

const ALL_MODULE_FEATURES = [
  'module:wms',
  'module:scm',
  'module:mes',
  'module:pos',
  'module:backup'
]

const buildServer = async (): Promise<FastifyInstance> => {
  const app = Fastify({ logger: true })

  const licenseKey = process.env.LICENSE_KEY || ''
  const licenseServerUrl = process.env.LICENSE_SERVER_URL || ''
  const licenseServerKey = process.env.LICENSE_SERVER_KEY || ''

  let allowedFeatures: string[] = []
  try {
    if (licenseKey && licenseServerUrl) {
      const result = await validateLicense(licenseKey, licenseServerUrl, licenseServerKey)
      if (result.valid) {
        allowedFeatures = result.features || []
        app.log.info({ features: allowedFeatures }, 'License validated')
      }
    }
  } catch (err) {
    app.log.warn({ err }, 'License validation failed — loading all modules')
  }

  if (!allowedFeatures.length) {
    allowedFeatures = [...ALL_MODULE_FEATURES]
  }

  app.decorate('loadedModules', [] as string[])
  app.decorate('skippedModules', [] as string[])
  app.decorate('licensedFeatures', allowedFeatures)

  await app.register(sensible)
  await app.register(corsPlugin)
  await app.register(helmet, {
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
  await app.register(jwtPlugin)
  await app.register(swaggerPlugin)
  await app.register(moduleLoaderPlugin, { features: allowedFeatures })
  await app.register(healthRoute, { prefix: '/api' })
  await app.register(publicRoute, { prefix: '/api' })
  await app.register(authRoute, { prefix: '/api' })
  await app.register(usersRoute, { prefix: '/api' })
  await app.register(licenseRoute, { prefix: '/api' })

  const webDistPath = join(__dirname, '../../web/dist')
  if (existsSync(webDistPath)) {
    await app.register(fastifyStatic, {
      root: webDistPath,
      prefix: '/'
    })

    app.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith('/api/')) {
        return reply.status(404).send({
          message: `Route ${request.method}:${request.url} not found`,
          error: 'Not Found',
          statusCode: 404
        })
      }
      return reply.sendFile('index.html')
    })
  }

  return app
}

const start = async (): Promise<void> => {
  try {
    const app = await buildServer()
    const host = process.env.API_HOST || '0.0.0.0'
    const port = Number(process.env.PORT) || 3001
    await app.listen({ port, host })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exit(1)
  }
}

if (process.env.NODE_ENV !== 'test') {
  void start()
}

export { buildServer }
