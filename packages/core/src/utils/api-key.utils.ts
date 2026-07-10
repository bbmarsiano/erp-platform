import { createHash, randomBytes } from 'node:crypto'

const API_KEY_PREFIX = 'dfk_live_'
const API_KEY_RANDOM_BYTES = 24

export function generateApiKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
  const randomPart = randomBytes(API_KEY_RANDOM_BYTES).toString('base64url')
  const rawKey = `${API_KEY_PREFIX}${randomPart}`
  return {
    rawKey,
    keyHash: hashApiKey(rawKey),
    keyPrefix: rawKey.slice(0, 12)
  }
}

export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex')
}

export function maskApiKeyPrefix(keyPrefix: string): string {
  return `${keyPrefix}****`
}

export function isApiKeyToken(token: string): boolean {
  return token.startsWith('dfk_')
}
