import { execFile } from 'node:child_process'
import { readFile, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { prisma } from '@dflow/db'
import {
  decryptBackupToSql,
  isEncryptedBackupPath
} from './backup-encryption.service'
import { parseDatabaseUrl } from './database-url.service'

const execFileAsync = promisify(execFile)
const STDERR_TRUNCATE = 2000
const CREATEDB_PRIVILEGE_ERROR =
  'Нямате права за създаване на временна база за тест на възстановяване. Нужен е CREATEDB привилегия за потребителя в DATABASE_URL.'

export interface RestoreTestResult {
  success: boolean
  tempDatabaseDropped: boolean
  tableCount?: number
  approxRowCount?: number
  errorMessage?: string
  durationMs: number
}

interface PsqlConnection {
  host: string
  port: string
  user: string
  password: string
  database: string
}

function buildTempDatabaseName(originalDatabase: string): string {
  const timestamp = Date.now()
  return `${originalDatabase}_restore_test_${timestamp}`
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .slice(0, 63)
}

function truncateText(text: string, max = STDERR_TRUNCATE): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max)}…`
}

function isCreatedbPrivilegeError(stderr: string, stdout: string): boolean {
  const combined = `${stderr}\n${stdout}`.toLowerCase()
  return (
    combined.includes('permission denied to create database') ||
    combined.includes('must be able to create databases') ||
    combined.includes('insufficient_privilege') ||
    combined.includes('42501')
  )
}

async function runPsql(
  connection: PsqlConnection,
  extraArgs: string[]
): Promise<{ stdout: string; stderr: string }> {
  const env = connection.password
    ? { ...process.env, PGPASSWORD: connection.password }
    : process.env
  const args = [
    '-h',
    connection.host,
    '-p',
    connection.port,
    '-U',
    connection.user,
    '-d',
    connection.database,
    ...extraArgs
  ]
  const { stdout, stderr } = await execFileAsync('psql', args, {
    env,
    maxBuffer: 20 * 1024 * 1024
  })
  return { stdout: stdout.toString(), stderr: stderr.toString() }
}

async function runPsqlOrThrow(
  connection: PsqlConnection,
  extraArgs: string[],
  context: string
): Promise<{ stdout: string; stderr: string }> {
  try {
    return await runPsql(connection, extraArgs)
  } catch (err) {
    const execErr = err as { stderr?: string | Buffer; stdout?: string | Buffer; message?: string }
    const stderr = execErr.stderr?.toString() ?? ''
    const stdout = execErr.stdout?.toString() ?? ''
    if (context === 'create_database' && isCreatedbPrivilegeError(stderr, stdout)) {
      throw new Error(CREATEDB_PRIVILEGE_ERROR)
    }
    const detail = truncateText(stderr || stdout || execErr.message || 'Неизвестна грешка')
    throw new Error(`${context}: ${detail}`)
  }
}

async function loadBackupSql(filePath: string, shouldDecrypt: boolean): Promise<Buffer> {
  if (shouldDecrypt) {
    const sql = await decryptBackupToSql(filePath)
    if (!sql.length) {
      throw new Error('Дешифрираният архив е празен.')
    }
    return sql
  }

  const sql = await readFile(filePath)
  if (!sql.length) {
    throw new Error('Архивният файл е празен.')
  }
  return sql
}

async function dropTempDatabase(connection: PsqlConnection, databaseName: string): Promise<boolean> {
  try {
    await runPsqlOrThrow(
      { ...connection, database: 'postgres' },
      [
        '-v',
        'ON_ERROR_STOP=1',
        '-c',
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${databaseName}' AND pid <> pg_backend_pid();`
      ],
      'terminate_connections'
    )
    await runPsqlOrThrow(
      { ...connection, database: 'postgres' },
      ['-v', 'ON_ERROR_STOP=1', '-c', `DROP DATABASE IF EXISTS "${databaseName}";`],
      'drop_database'
    )
    return true
  } catch (err) {
    console.error(
      `[restore-test] Failed to drop temp database "${databaseName}":`,
      err instanceof Error ? err.message : err
    )
    return false
  }
}

async function deleteTempSqlFile(tempSqlFile: string | null): Promise<void> {
  if (!tempSqlFile) return
  try {
    await unlink(tempSqlFile)
  } catch (err) {
    console.error(`[restore-test] Failed to delete temp SQL file "${tempSqlFile}":`, err)
  }
}

export function formatRestoreTestNote(result: RestoreTestResult): string {
  if (!result.success) {
    return result.errorMessage ?? 'Тест на възстановяване: неуспешен.'
  }

  const dropped = result.tempDatabaseDropped ? 'временна база изтрита' : 'временна база не е изтрита'
  const rows =
    result.approxRowCount !== undefined
      ? `~${result.approxRowCount.toLocaleString('bg-BG')} реда`
      : 'неизвестен брой редове'
  return `Тест на възстановяване: успешно, ${result.tableCount ?? 0} таблици, ${rows}, ${dropped}.`
}

export async function runRestoreTest(jobId: string): Promise<RestoreTestResult> {
  const startedAt = Date.now()
  let tempDatabaseName: string | null = null
  let tempSqlFile: string | null = null
  let connection: PsqlConnection | null = null
  let result: RestoreTestResult = {
    success: false,
    tempDatabaseDropped: false,
    durationMs: 0
  }

  try {
    const job = await prisma.backupJob.findUnique({
      where: { id: jobId },
      include: { policy: true }
    })
    if (!job) {
      throw new Error('Архивната задача не е намерена.')
    }
    if (!job.filePath) {
      throw new Error('Архивният файл липсва за тази задача.')
    }

    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      throw new Error('DATABASE_URL не е конфигуриран.')
    }

    const parsed = parseDatabaseUrl(dbUrl)
    connection = {
      host: parsed.host,
      port: parsed.port,
      user: parsed.user,
      password: parsed.password,
      database: parsed.database
    }

    const shouldDecrypt =
      isEncryptedBackupPath(job.filePath) || job.policy?.isEncrypted !== false
    const sql = await loadBackupSql(job.filePath, shouldDecrypt)

    tempSqlFile = join(tmpdir(), `dflow-restore-test-${jobId}-${Date.now()}.sql`)
    await writeFile(tempSqlFile, sql)

    tempDatabaseName = buildTempDatabaseName(parsed.database)
    await runPsqlOrThrow(
      { ...connection, database: 'postgres' },
      ['-v', 'ON_ERROR_STOP=1', '-c', `CREATE DATABASE "${tempDatabaseName}";`],
      'create_database'
    )

    try {
      await runPsqlOrThrow(
        { ...connection, database: tempDatabaseName },
        ['-v', 'ON_ERROR_STOP=1', '-f', tempSqlFile],
        'psql_restore'
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Неуспешно зареждане на архива във временната база.'
      throw new Error(message)
    }

    const tableCountResult = await runPsqlOrThrow(
      { ...connection, database: tempDatabaseName },
      [
        '-t',
        '-A',
        '-c',
        `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';`
      ],
      'table_count'
    )
    const tableCount = Number.parseInt(tableCountResult.stdout.trim(), 10) || 0

    // reltuples is a planner estimate, not an exact row count.
    const rowCountResult = await runPsqlOrThrow(
      { ...connection, database: tempDatabaseName },
      [
        '-t',
        '-A',
        '-c',
        `SELECT COALESCE(SUM(c.reltuples::bigint), 0)
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public' AND c.relkind = 'r';`
      ],
      'row_count'
    )
    const approxRowCount = Number.parseInt(rowCountResult.stdout.trim(), 10) || 0

    result = {
      success: true,
      tempDatabaseDropped: false,
      tableCount,
      approxRowCount,
      durationMs: Date.now() - startedAt
    }
  } catch (err) {
    result = {
      success: false,
      tempDatabaseDropped: false,
      errorMessage: err instanceof Error ? err.message : 'Тест на възстановяване: неуспешен.',
      durationMs: Date.now() - startedAt
    }
  } finally {
    if (connection && tempDatabaseName) {
      result.tempDatabaseDropped = await dropTempDatabase(connection, tempDatabaseName)
    }
    await deleteTempSqlFile(tempSqlFile)
  }

  return result
}
