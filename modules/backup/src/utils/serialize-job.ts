export function serializeBackupJob<T extends { sizeBytes?: bigint | number | null }>(job: T) {
  return {
    ...job,
    sizeBytes: job.sizeBytes != null ? Number(job.sizeBytes) : null
  }
}

export function serializeBackupJobs<T extends { sizeBytes?: bigint | number | null }>(jobs: T[]) {
  return jobs.map(serializeBackupJob)
}
