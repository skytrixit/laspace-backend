import { randomInt } from 'node:crypto'

/* No 0/O or 1/I, so a code read out over the phone survives the call. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** `LA` + 8 unambiguous characters = the CHAR(10) reference on every enquiry. */
export function referenceCode(): string {
  let tail = ''
  for (let i = 0; i < 8; i++) tail += ALPHABET[randomInt(ALPHABET.length)]
  return `LA${tail}`
}

export const REFERENCE_PATTERN = /^LA[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/
