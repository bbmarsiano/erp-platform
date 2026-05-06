import type { ModuleManifest } from '@dflow/core'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { fileURLToPath } from 'url'
import { dirname, resolve, join } from 'path'
import { pathToFileURL } from 'node:url'

export const loadedModules: ModuleManifest[] = []
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const moduleLoaderPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const modulesDir = resolve(__dirname, '../../../../modules')
  const loaded: string[] = []
  const failures: string[] = []

  try {
    const entries = await readdir(modulesDir, { withFileTypes: true })
    const moduleDirs = entries.filter((entry) => entry.isDirectory())

    for (const moduleDir of moduleDirs) {
      const pluginPath = join(modulesDir, moduleDir.name, 'module.plugin.ts')
      const pluginJsPath = join(modulesDir, moduleDir.name, 'module.plugin.js')
      const candidate = existsSync(pluginPath) ? pluginPath : pluginJsPath

      if (!existsSync(candidate)) {
        continue
      }

      try {
        const imported = await import(pathToFileURL(candidate).href)
        const plugin = imported.default as FastifyPluginAsync | undefined
        const manifest = imported.manifest as ModuleManifest | undefined

        if (plugin) {
          await fastify.register(plugin, { prefix: manifest?.apiPrefix })
        }

        if (manifest) {
          loadedModules.push(manifest)
        }

        loaded.push(moduleDir.name)
        fastify.log.info(`Loaded module: ${moduleDir.name}`)
      } catch (error) {
        failures.push(moduleDir.name)
        fastify.log.error({ error }, `Failed loading module: ${moduleDir.name}`)
      }
    }
  } catch (error) {
    fastify.log.warn({ error }, 'No modules directory discovered yet')
  }

  if (failures.length > 0) {
    fastify.log.warn({ failures }, 'Some modules failed to load')
  }

  fastify.log.info({ loaded, failures }, 'Module loader completed')
}

export default moduleLoaderPlugin
