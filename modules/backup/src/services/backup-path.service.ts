import { access, constants, mkdir, unlink, writeFile } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'

export const PRODUCTION_DEFAULT_BACKUP_DIR = '/opt/dflow-erp/backups'

/** Dev fallback: apps/api/backups — anchored to module location, not process.cwd(). */
const DEV_DEFAULT_BACKUP_DIR = join(__dirname, '../../../../../apps/api/backups')

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

  return DEV_DEFAULT_BACKUP_DIR
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
