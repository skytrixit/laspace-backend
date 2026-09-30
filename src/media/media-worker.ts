import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type { Env } from '../config/env'
import { dominantColor, encode, EXT, FORMATS, MIME, planWidths } from './image-processing'
import { MediaAsset, type MediaDerivative } from './media-asset.entity'
import { MEDIA_STORAGE, type MediaStorage } from './storage/media-storage'

/* ── Derivative worker ─────────────────────────────────────────────────────
   In-process queue. An upload returns as soon as the original is stored;
   this turns it into the five-width, three-format set afterwards and flips
   the row to `ready`. Concurrency is capped because AVIF encoding is CPU
   heavy and the same process serves pages. Rows still `processing` at boot
   are re-queued, so a restart mid-job recovers.
   ------------------------------------------------------------------------ */

@Injectable()
export class MediaWorker implements OnApplicationBootstrap {
  private readonly log = new Logger(MediaWorker.name)
  private readonly queue: number[] = []
  private active = 0
  private readonly concurrency: number

  constructor(
    @InjectRepository(MediaAsset) private readonly repo: Repository<MediaAsset>,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
    config: ConfigService<Env, true>,
  ) {
    this.concurrency = config.get('MEDIA_WORKER_CONCURRENCY')
  }

  async onApplicationBootstrap() {
    const stuck = await this.repo.find({ where: { status: 'processing' }, select: { id: true } })
    if (stuck.length) this.log.log(`re-queueing ${stuck.length} unfinished upload(s)`)
    stuck.forEach((row) => this.enqueue(row.id))
  }

  enqueue(id: number) {
    if (!this.queue.includes(id)) this.queue.push(id)
    this.pump()
  }

  /** Waits until nothing is queued or running — for tests and graceful shutdown. */
  async idle() {
    while (this.queue.length || this.active) await new Promise((r) => setTimeout(r, 50))
  }

  private pump() {
    while (this.active < this.concurrency && this.queue.length) {
      const id = this.queue.shift()!
      this.active += 1
      this.process(id)
        .catch((err) => this.log.error({ err, id }, 'derivative generation failed'))
        .finally(() => {
          this.active -= 1
          this.pump()
        })
    }
  }

  private async process(id: number) {
    const row = await this.repo.findOneBy({ id })
    if (!row || row.status !== 'processing') return
    const started = Date.now()
    try {
      const original = await this.storage.get(row.storageKey)
      const dir = row.storageKey.slice(0, row.storageKey.lastIndexOf('/'))
      const lqipColor = await dominantColor(original)
      const derivatives: MediaDerivative[] = []
      for (const width of planWidths(row.width)) {
        for (const format of FORMATS) {
          const { data, info } = await encode(original, width, format)
          const key = `${dir}/${info.width}.${EXT[format]}`
          await this.storage.put(key, data, MIME[format])
          derivatives.push({ format, width: info.width, height: info.height, key, bytes: data.byteLength })
        }
      }
      await this.repo.update(id, { derivatives, lqipColor, status: 'ready' })
      this.log.log(`media ${id}: ${derivatives.length} derivatives in ${((Date.now() - started) / 1000).toFixed(1)}s`)
    } catch (err) {
      await this.repo.update(id, { status: 'failed' })
      throw err
    }
  }
}
