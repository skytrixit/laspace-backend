import { UnsupportedMediaTypeException } from '@nestjs/common'
import sharp, { type Metadata, type OutputInfo } from 'sharp'

/* ── Image processing ──────────────────────────────────────────────────────
   The rules the pipeline applies to every upload, kept pure enough to test:
   which widths to make, how to encode each format, how to read the
   original safely.
   ------------------------------------------------------------------------ */

/** The srcset ladder. A 400px column at 2× DPR takes the 800; nothing is upscaled. */
export const WIDTHS = [400, 800, 1200, 1600, 2400] as const

export type Format = 'avif' | 'webp' | 'jpeg'
export const FORMATS: Format[] = ['avif', 'webp', 'jpeg']
export const EXT: Record<Format, string> = { avif: 'avif', webp: 'webp', jpeg: 'jpg' }
export const MIME: Record<Format, string> = { avif: 'image/avif', webp: 'image/webp', jpeg: 'image/jpeg' }

/** Standard widths below the original, plus the original itself when it is smaller than the largest standard width. */
export function planWidths(originalWidth: number): number[] {
  const ladder: number[] = WIDTHS.filter((w) => w < originalWidth)
  const top = WIDTHS[WIDTHS.length - 1]
  if (originalWidth <= top) ladder.push(originalWidth)
  return ladder
}

const ACCEPTED: Record<string, string> = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif', heif: 'image/heif', tiff: 'image/tiff' }

export type Inspected = { format: string; mime: string; width: number; height: number }

/** Reads the real container, not the extension or the client's claim; EXIF rotation is honoured. */
export async function inspect(buffer: Buffer): Promise<Inspected> {
  let meta: Metadata
  try {
    meta = await sharp(buffer).metadata()
  } catch {
    throw unsupported()
  }
  const format = meta.format ?? ''
  const mime = ACCEPTED[format]
  if (!mime || !meta.width || !meta.height) throw unsupported()
  const swapped = (meta.orientation ?? 1) >= 5
  return { format, mime, width: swapped ? meta.height : meta.width, height: swapped ? meta.width : meta.height }
}

const unsupported = () =>
  new UnsupportedMediaTypeException({
    statusCode: 415,
    code: 'unsupported_media_type',
    message: 'Upload a JPEG, PNG, WebP or AVIF image.',
    fields: { file: 'JPEG, PNG, WebP or AVIF only.' },
  })

/** The average colour, as the placeholder shown while the real image loads. */
export async function dominantColor(buffer: Buffer): Promise<string> {
  const { dominant } = await sharp(buffer).rotate().resize(64, 64, { fit: 'inside' }).stats()
  const hex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}`
}

/** One derivative: rotated, resized (never enlarged), metadata stripped, encoded. */
export function encode(buffer: Buffer, width: number, format: Format): Promise<{ data: Buffer; info: OutputInfo }> {
  const image = sharp(buffer).rotate().resize({ width, withoutEnlargement: true })
  const encoded =
    format === 'avif'
      ? image.avif({ quality: 60, effort: 4 })
      : format === 'webp'
        ? image.webp({ quality: 78 })
        : image.jpeg({ quality: 80, mozjpeg: true, progressive: true })
  return encoded.toBuffer({ resolveWithObject: true })
}
