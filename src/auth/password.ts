import argon2 from 'argon2'

/* argon2id at roughly the OWASP-recommended cost: 19 MiB, 2 iterations.
   Around 50 ms on a modest core — imperceptible on login, expensive to brute
   force. */
const OPTIONS = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const

export const hashPassword = (plain: string) => argon2.hash(plain, OPTIONS)

/** Never throws — a malformed hash is treated as a mismatch. */
export const verifyPassword = (hash: string, plain: string) =>
  argon2.verify(hash, plain).catch(() => false)

/* Verified against when the email is unknown, so a wrong email and a wrong
   password take the same time to reject. */
let dummy: Promise<string> | undefined
export const dummyHash = () => (dummy ??= hashPassword('not-a-real-password'))

export const MIN_PASSWORD_LENGTH = 10
