import { randomUUID } from 'node:crypto'
import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EXT, inspect, type Format } from './image-processing'
import { MediaAsset } from './media-asset.entity'
import { MediaWorker } from './media-worker'
import { MEDIA_STORAGE, OWNED_KEY, type MediaStorage } from './storage/media-storage'

const notFound = () => new NotFoundException({ statusCode: 404, code: 'not_found', message: 'No such image.' })

/** Original uploads keep their real container; PNG stays PNG until the worker derives from it. */
const ORIGINAL_EXT: Record<string, string> = { jpeg: 'jpg', png: 'png', webp: 'webp', avif: 'avif', heif: 'heif', tiff: 'tiff' }

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(MediaAsset) private readonly repo: Repository<MediaAsset>,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
    private readonly worker: MediaWorker,
  ) {}

  /** Stores the original, records what it is, and hands the rest to the worker. */
  async upload(file: Express.Multer.File | undefined, altText?: string): Promise<MediaAsset> {
    if (!file) {
      throw new UnprocessableEntityException({ statusCode: 422, code: 'validation_failed', message: 'Choose an image.', fields: { file: 'Choose an image.' } })
    }
    const info = await inspect(file.buffer)
    const key = `media/${randomUUID()}/original.${ORIGINAL_EXT[info.format] ?? 'bin'}`
    await this.storage.put(key, file.buffer, info.mime)

    const row = await this.repo.save(
      this.repo.create({
        storageKey: key,
        originalFilename: file.originalname.replace(/[^\w.() -]/g, '_').slice(0, 255) || 'upload',
        mime: info.mime,
        byteSize: file.size,
        width: info.width,
        height: info.height,
        altText: altText ?? null,
        status: 'processing',
        derivatives: null,
      }),
    )
    this.worker.enqueue(row.id)
    return row
  }

  async get(id: number): Promise<MediaAsset> {
    const row = await this.repo.findOneBy({ id })
    if (!row) throw notFound()
    return row
  }

  async setAlt(id: number, altText: string | null): Promise<MediaAsset> {
    const row = await this.get(id)
    row.altText = altText
    return this.repo.save(row)
  }

  /** Removes every file the pipeline wrote, then the row. Seeded site images are never on disk here and are left alone. */
  async remove(id: number): Promise<void> {
    const row = await this.get(id)
    const keys = [row.storageKey, ...(row.derivatives ?? []).map((d) => d.key)].filter((k) => OWNED_KEY.test(k))
    await this.storage.delete(keys)
    await this.repo.delete(id)
  }

  /** The largest JPEG derivative once ready — what an <img src> falls back to. */
  static fallbackKey(asset: MediaAsset): string {
    const jpegs = (asset.derivatives ?? []).filter((d) => d.format === ('jpeg' as Format) || d.key.endsWith(`.${EXT.jpeg}`))
    const largest = jpegs.sort((a, b) => b.width - a.width)[0]
    return largest?.key ?? asset.storageKey
  }
}
