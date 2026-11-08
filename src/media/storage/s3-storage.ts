import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { IMMUTABLE_CACHE, OWNED_KEY, type MediaStorage } from './media-storage'

export type S3Settings = { endpoint: string; region: string; bucket: string; accessKey: string; secretKey: string }

/** Any S3-compatible bucket — R2, S3, Spaces, MinIO — behind a CDN. */
export class S3MediaStorage implements MediaStorage {
  private readonly client: S3Client
  private readonly bucket: string

  constructor(s: S3Settings) {
    this.bucket = s.bucket
    this.client = new S3Client({
      endpoint: s.endpoint,
      region: s.region,
      credentials: { accessKeyId: s.accessKey, secretAccessKey: s.secretKey },
      forcePathStyle: true,
    })
  }

  private check(key: string) {
    if (!OWNED_KEY.test(key)) throw new Error(`Refusing to touch key outside the media store: ${key}`)
    return key
  }

  async put(key: string, body: Buffer, contentType: string) {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: this.check(key), Body: body, ContentType: contentType, CacheControl: IMMUTABLE_CACHE }),
    )
  }

  async get(key: string) {
    const out = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: this.check(key) }))
    return Buffer.from(await out.Body!.transformToByteArray())
  }

  async delete(keys: string[]) {
    if (!keys.length) return
    await this.client.send(
      new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: keys.map((Key) => ({ Key: this.check(Key) })), Quiet: true } }),
    )
  }
}
