import { createHash, randomBytes } from 'node:crypto'

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

/** 32 random bytes as base64url — the bearer token the client holds. Only its hash is stored. */
export function generateToken() {
  const token = randomBytes(32).toString('base64url')
  return { token, hash: sha256(token) }
}
