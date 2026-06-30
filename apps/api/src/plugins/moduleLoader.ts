import type { ModuleManifest } from '@dflow/core'
import type { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from 'fastify'
import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { resolve, join } from 'path'

interface ModuleLoaderOptions extends FastifyPluginOptions {
  features: string[]
}

const MODULE_FEATURE_MAP: Record<string, string> = {
  wms: 'module:wms',
  scm: 'module:scm',
  mes: 'module:mes',
  pos: 'module:pos',
  backup: 'module:backup',
  finance: 'module:finance'
}

const globalForModules = globalThis as typeof globalThis & {
  __dflowLoadedModules?: ModuleManifest[]
}

export const loadedModules: ModuleManifest[] =
  globalForModules.__dflowLoadedModules ??
  (globalForModules.__dflowLoadedModules = [])

export const moduleLoaderPlugin: FastifyPluginAsync<ModuleLoaderOptions> = async (
  fastify: FastifyInstance,
  options: ModuleLoaderOptions
) => {
  const { features } = options
  const modulesDir = resolve(__dirname, '../../../../modules')

  if (!existsSync(modulesDir)) {
    fastify.log.warn({ modulesDir }, 'Modules directory not found')
    return
  }

  const loaded: string[] = []
  const failures: string[] = []
  const skipped: string[] = []

  const entries = await readdir(modulesDir, { withFileTypes: true })
  const moduleDirs = entries.filter((entry) => entry.isDirectory())

  for (const moduleDir of moduleDirs) {
    const moduleName = moduleDir.name
    const featureKey = MODULE_FEATURE_MAP[moduleName]

    if (featureKey && !features.includes(featureKey)) {
      fastify.log.info(
        { module: moduleName, feature: featureKey },
        'Module skipped — not in license features'
      )
      skipped.push(moduleName)
      continue
    }

    try {
      const pluginTsPath = join(modulesDir, moduleName, 'module.plugin.ts')
      const pluginJsPath = join(modulesDir, moduleName, 'module.plugin.js')
      const candidate = existsSync(pluginTsPath) ? pluginTsPath : pluginJsPath

      if (!existsSync(candidate)) {
        fastify.log.warn({ module: moduleName }, 'No module.plugin found')
        continue
      }

      const imported = require(candidate)
      const plugin = imported.default as FastifyPluginAsync | undefined
      const manifest =
        (imported.manifest as ModuleManifest | undefined) ??
        (Object.values(imported).find(
          (value): value is ModuleManifest =>
            typeof value === 'object' &&
            value !== null &&
            'id' in value &&
            'apiPrefix' in value
        ) as ModuleManifest | undefined)

      if (plugin) {
        await fastify.register(plugin)
      }

      if (manifest) {
        loadedModules.push(manifest)
      }

      loaded.push(moduleName)
      fastify.loadedModules.push(moduleName)
      fastify.log.info({ module: moduleName }, 'Loaded module')
    } catch (error) {
      failures.push(moduleName)
      fastify.log.error({ error }, `Failed loading module: ${moduleName}`)
    }
  }

  for (const name of skipped) {
    fastify.skippedModules.push(name)
  }

  if (failures.length > 0) {
    fastify.log.warn({ failures }, 'Some modules failed to load')
  }

  fastify.log.info({ loaded, skipped, failures }, 'Module loader completed')
}

export default moduleLoaderPlugin
