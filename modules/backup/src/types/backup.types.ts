// Go daemon communication interface
export interface BackupDaemonConfig {
  apiUrl: string
  apiKey: string
  dbConnectionString: string
  backupPath: string
  encryptionKey: string
}

export interface BackupDaemonStatus {
  isRunning: boolean
  lastHeartbeat: Date
  version: string
  platform: 'windows' | 'linux' | 'darwin'
}

// Ransomware protection - immutable backup metadata
export interface BackupIntegrityCheck {
  jobId: string
  checksum: string
  algorithm: 'sha256'
  verifiedAt: Date
  isImmutable: boolean
}

