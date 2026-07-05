import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { mkdir, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { prisma } from '@dflow/db'

const execFileAsync = promisify(execFile)
const PRODUCTION_DEFAULT_BACKUP_DIR = '/opt/dflow-erp/backups'

function resolveBackupDirectory(targetPath?: string | null): string {
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

async function ensureBackupDirectory(dir: string): Promise<void> {
  try {
    await mkdir(dir, { recursive: true })
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

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: parsed.port || '5432',
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, '')
  }
}

async function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

export async function getBackupAgentStatus() {
  try {
    await execFileAsync('pg_dump', ['--version'])
    return {
      connected: true,
      status: 'ready' as const,
      message: 'Backup агентът е готов'
    }
  } catch {
    return {
      connected: false,
      status: 'unavailable' as const,
      message: 'pg_dump не е наличен на сървъра'
    }
  }
}

export function scheduleBackupJob(jobId: string, targetPath?: string | null) {
  void runBackupJob(jobId, targetPath)
}

async function runBackupJob(jobId: string, targetPath?: string | null) {
  try {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      throw new Error('DATABASE_URL не е конфигуриран')
    }

    await prisma.backupJob.updateMany({
      where: { id: jobId, status: 'PENDING' },
      data: { status: 'RUNNING', startedAt: new Date() }
    })

    const { host, port, user, password, database } = parseDatabaseUrl(dbUrl)
    const backupDir = resolveBackupDirectory(targetPath)
    await ensureBackupDirectory(backupDir)

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filePath = join(backupDir, `backup-${timestamp}.sql`)

    const args = ['-h', host, '-p', port, '-U', user, '-d', database, '-f', filePath, '--no-password']
    const env = password ? { ...process.env, PGPASSWORD: password } : process.env
    await execFileAsync('pg_dump', args, { env })

    const fileStat = await stat(filePath)
    const checksum = await hashFile(filePath)

    await prisma.backupJob.updateMany({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        sizeBytes: BigInt(fileStat.size),
        filePath,
        checksum,
        isVerified: false,
        errorMsg: null
      }
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Backup failed'
    await prisma.backupJob.updateMany({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errorMsg: message,
        completedAt: new Date()
      }
    })
  }
}
