import { access, constants, mkdir, unlink, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

export const PRODUCTION_DEFAULT_BACKUP_DIR = '/opt/dflow-erp/backups'

export function resolveBackupTargetPath(targetPath?: string | null): string {
  const policyPath = targetPath?.trim()
  if (policyPath) {
    return policyPath.startsWith('/') ? policyPath : resolve(process.cwd(), policyPath)
  }

  const envPath = process.env.BACKUP_STORAGE_PATH?.trim()
  if (envPath) {
    return envPath.startsWith('/') ? envPath : resolve(process.cwd(), envPath)
  }

  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_DEFAULT_BACKUP_DIR
  }

  return join(process.cwd(), 'backups')
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
