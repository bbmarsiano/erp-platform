import 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    loadedModules: string[]
    skippedModules: string[]
    licensedFeatures: string[]
  }
}

export {}
