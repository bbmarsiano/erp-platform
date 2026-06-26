import { prisma } from '@dflow/db'

const DEV_SIMULATION_DELAY_MS = 2000
const MIN_SIZE_BYTES = 50 * 1024 * 1024
const MAX_SIZE_BYTES = 200 * 1024 * 1024

export function scheduleDevBackupSimulation(jobId: string) {
  if (process.env.NODE_ENV !== 'development') return

  setTimeout(() => {
    void (async () => {
      try {
        const timestamp = Date.now()
        const sizeBytes = BigInt(
          Math.floor(MIN_SIZE_BYTES + Math.random() * (MAX_SIZE_BYTES - MIN_SIZE_BYTES))
        )

        await prisma.backupJob.updateMany({
          where: { id: jobId, status: 'PENDING' },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            sizeBytes,
            filePath: `/backups/dflow/backup-${timestamp}.sql.gz`,
            isVerified: false
          }
        })
      } catch (err) {
        console.error('[backup] dev simulation failed for job', jobId, err)
      }
    })()
  }, DEV_SIMULATION_DELAY_MS)
}
