import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { readFile, unlink, writeFile } from 'node:fs/promises'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

export function isEncryptedBackupPath(filePath: string): boolean {
  return filePath.endsWith('.sql.enc')
}

export function requireBackupEncryptionKey(isEncrypted: boolean): void {
  if (!isEncrypted) return
  getBackupEncryptionKey()
}

export function getBackupEncryptionKey(): Buffer {
  const raw = process.env.BACKUP_ENCRYPTION_KEY?.trim()
  if (!raw || !/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error(
      'BACKUP_ENCRYPTION_KEY липсва или е невалиден. Задайте 64 hex символа (openssl rand -hex 32).'
    )
  }
  return Buffer.from(raw, 'hex')
}

export async function encryptBackupFile(plaintextPath: string, encryptedPath: string): Promise<void> {
  const key = getBackupEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const plaintext = await readFile(plaintextPath)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const authTag = cipher.getAuthTag()
  await writeFile(encryptedPath, Buffer.concat([iv, authTag, ciphertext]))
  await unlink(plaintextPath)
}

export async function decryptBackupToSql(encryptedPath: string): Promise<Buffer> {
  const key = getBackupEncryptionKey()
  const payload = await readFile(encryptedPath)

  if (payload.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Невалиден криптиран архив — файлът е твърде малък или повреден.')
  }

  const iv = payload.subarray(0, IV_LENGTH)
  const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    return Buffer.concat([decipher.update(ciphertext), decipher.final()])
  } catch {
    throw new Error(
      'Неуспешно дешифриране на архива. Проверете BACKUP_ENCRYPTION_KEY или целостта на файла.'
    )
  }
}
