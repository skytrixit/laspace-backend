import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Env } from '../config/env'
import type { MediaAsset, MediaDerivative } from './media-asset.entity'

/** What the admin and the public pages get for an image: URLs, never storage keys. */
export type MediaView = {
  id: number
  src: string
  width: number
  height: number
  alt: string | null
  lqipColor: string | null
  status: MediaAsset['status']
  derivatives: (MediaDerivative & { src: string })[]
}

@Injectable()
export class MediaUrlService {
  private readonly base: string

  constructor(config: ConfigService<Env, true>) {
    /* Behind a CDN the key is appended to its origin; otherwise the same
       origin serves it (the site's own /images for the seeded photography,
       the API's media route for uploads). */
    const cdn = config.get('CDN_BASE_URL')
    this.base = cdn ? cdn.replace(/\/+$/, '') : ''
  }

  url(key: string): string {
    return `${this.base}/${key.replace(/^\/+/, '')}`
  }

  view(asset: MediaAsset | null | undefined): MediaView | null {
    if (!asset) return null
    const jpegs = (asset.derivatives ?? []).filter((d) => d.format === 'jpeg').sort((a, b) => b.width - a.width)
    return {
      id: asset.id,
      /* The largest JPEG once ready — what a plain <img src> should get; the original until then. */
      src: this.url(asset.status === 'ready' && jpegs[0] ? jpegs[0].key : asset.storageKey),
      width: asset.width,
      height: asset.height,
      alt: asset.altText,
      lqipColor: asset.lqipColor,
      status: asset.status,
      derivatives: (asset.derivatives ?? []).map((d) => ({ ...d, src: this.url(d.key) })),
    }
  }
}
