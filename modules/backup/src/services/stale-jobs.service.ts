import { prisma } from '@dflow/db'

const STALE_PENDING_MS = 10 * 60 * 1000
const STALE_ERROR_MSG = 'Timeout — Go daemon не е свързан'

export async function cleanupStaleBackupJobs(tenantId?: string) {
  const cutoff = new Date(Date.now() - STALE_PENDING_MS)
  const result = await prisma.backupJob.updateMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: cutoff },
      ...(tenantId ? { tenantId } : {})
    },
    data: {
      status: 'FAILED',
      errorMsg: STALE_ERROR_MSG,
      completedAt: new Date()
    }
  })
  return result.count
}
