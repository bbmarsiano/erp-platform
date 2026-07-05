import { existsSync, readFileSync } from 'node:fs'
import { access, constants, mkdir, unlink, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join } from 'node:path'

export const PRODUCTION_DEFAULT_BACKUP_DIR = '/opt/dflow-erp/backups'
const API_PACKAGE_NAME = '@dflow/api'

function findApiPackageRoot(startDir: string): string {
  let dir = startDir
  while (true) {
    const packageJsonPath = join(dir, 'package.json')
    if (existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { name?: string }
        if (pkg.name === API_PACKAGE_NAME) {
          return dir
        }
      } catch {
        // ignore malformed package.json
      }
    }

    const nestedApiPkg = join(dir, 'apps', 'api', 'package.json')
    if (existsSync(nestedApiPkg)) {
      try {
        const pkg = JSON.parse(readFileSync(nestedApiPkg, 'utf8')) as { name?: string }
        if (pkg.name === API_PACKAGE_NAME) {
          return join(dir, 'apps', 'api')
        }
      } catch {
        // ignore malformed package.json
      }
    }

    const parent = dirname(dir)
    if (parent === dir) {
      throw new Error('Could not locate apps/api package root')
    }
    dir = parent
  }
}

let devDefaultBackupDirCache: string | undefined

export function resolveDevDefaultBackupDir(): string {
  if (!devDefaultBackupDirCache) {
    devDefaultBackupDirCache = join(findApiPackageRoot(__dirname), 'backups')
  }
  return devDefaultBackupDirCache
}

export function backupAbsolutePathError(value: string): string {
  return `Пътят '${value}' трябва да е абсолютен (да започва с /). Относителни пътища не се поддържат.`
}

function assertAbsolutePath(value: string): void {
  if (!isAbsolute(value)) {
    throw new Error(backupAbsolutePathError(value))
  }
}

export function resolveBackupTargetPath(targetPath?: string | null): string {
  const policyPath = targetPath?.trim()
  if (policyPath) {
    assertAbsolutePath(policyPath)
    return policyPath
  }

  const envPath = process.env.BACKUP_STORAGE_PATH?.trim()
  if (envPath) {
    assertAbsolutePath(envPath)
    return envPath
  }

  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_DEFAULT_BACKUP_DIR
  }

  return resolveDevDefaultBackupDir()
}

async function prepareBackupDirectory(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true })
  await access(dir, constants.W_OK)
  const marker = join(dir, `.dflow-write-test-${process.pid}-${Date.now()}`)
  await writeFile(marker, 'ok')
  await unlink(marker)
}

export function backupTargetPathPolicyError(resolvedPath: string): string {
  return `Директорията '${resolvedPath}' не съществува и не може да бъде създадена. Проверете пътя и правата за достъп.`
}

export async function validateBackupTargetPathForPolicy(targetPath?: string | null): Promise<void> {
  const resolvedPath = resolveBackupTargetPath(targetPath)
  try {
    await prepareBackupDirectory(resolvedPath)
  } catch {
    throw new Error(backupTargetPathPolicyError(resolvedPath))
  }
}

export async function ensureBackupDirectory(dir: string): Promise<void> {
  try {
    await prepareBackupDirectory(dir)
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : ''
    if (code === 'EACCES' || code === 'EPERM' || code === 'ENOENT') {
      throw new Error(
        `Няма права за писане в директорията за архиви: ${dir}. Провери правата на директорията.`
      )
    }
    throw err
  }
}
