import { prisma } from '../src/index'

const STALE_ERROR_MSG = 'Timeout — Go daemon не е свързан'

async function main() {
  const cutoff = new Date(Date.now() - 10 * 60 * 1000)

  const staleJobs = await prisma.backupJob.updateMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: cutoff }
    },
    data: {
      status: 'FAILED',
      errorMsg: STALE_ERROR_MSG,
      completedAt: new Date()
    }
  })

  const policyUpdate = await prisma.backupPolicy.updateMany({
    where: { id: 'default-backup-policy' },
    data: { targetPath: '/backups/dflow' }
  })

  console.log(`✅ Marked ${staleJobs.count} stale PENDING backup job(s) as FAILED`)
  console.log(`✅ Updated targetPath on ${policyUpdate.count} backup policy/policies`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
