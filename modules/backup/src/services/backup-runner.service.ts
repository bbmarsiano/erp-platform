import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { mkdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { prisma } from '@dflow/db'

const execFileAsync = promisify(execFile)

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
    const backupDir = targetPath?.trim() || process.env.BACKUP_PATH || './backups/dflow'
    await mkdir(backupDir, { recursive: true })

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
