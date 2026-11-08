/* ── Storage behind the media pipeline ─────────────────────────────────────
   One interface, two drivers: local disk for development, any S3-compatible
   bucket for staging and production. Keys are paths like
   media/<uuid>/800.avif; the driver never decides names.
   ------------------------------------------------------------------------ */

export interface MediaStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>
  get(key: string): Promise<Buffer>
  /** Missing keys are not an error. */
  delete(keys: string[]): Promise<void>
}

export const MEDIA_STORAGE = Symbol('MEDIA_STORAGE')

/** Derivatives never change once written, so browsers and CDNs may keep them for a year. */
export const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable'

/** Only keys the pipeline minted are ever written or deleted. */
export const OWNED_KEY = /^media\/[0-9a-f-]{36}\/[a-z0-9]+\.[a-z0-9]+$/
