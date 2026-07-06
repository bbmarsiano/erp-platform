import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { prisma } from '@dflow/db'
import {
  encryptBackupFile,
  requireBackupEncryptionKey
} from './backup-encryption.service'
import { ensureBackupDirectory, resolveBackupTargetPath } from './backup-path.service'
import { parseDatabaseUrl } from './database-url.service'

const execFileAsync = promisify(execFile)

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
    const job = await prisma.backupJob.findUnique({
      where: { id: jobId },
      include: { policy: true }
    })
    if (!job) {
      throw new Error('Архивната задача не е намерена')
    }

    const isEncrypted = job.policy?.isEncrypted ?? true
    requireBackupEncryptionKey(isEncrypted)

    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      throw new Error('DATABASE_URL не е конфигуриран')
    }

    await prisma.backupJob.updateMany({
      where: { id: jobId, status: 'PENDING' },
      data: { status: 'RUNNING', startedAt: new Date() }
    })

    const { host, port, user, password, database } = parseDatabaseUrl(dbUrl)
    const backupDir = resolveBackupTargetPath(targetPath)
    await ensureBackupDirectory(backupDir)

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const plaintextPath = join(backupDir, `backup-${timestamp}.sql`)

    const args = ['-h', host, '-p', port, '-U', user, '-d', database, '-f', plaintextPath, '--no-password']
    const env = password ? { ...process.env, PGPASSWORD: password } : process.env
    await execFileAsync('pg_dump', args, { env })

    let finalPath = plaintextPath
    if (isEncrypted) {
      finalPath = join(backupDir, `backup-${timestamp}.sql.enc`)
      await encryptBackupFile(plaintextPath, finalPath)
    }

    const fileStat = await stat(finalPath)
    const checksum = await hashFile(finalPath)

    await prisma.backupJob.updateMany({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        sizeBytes: BigInt(fileStat.size),
        filePath: finalPath,
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
