import path from 'node:path'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MulterModule } from '@nestjs/platform-express'
import { TypeOrmModule } from '@nestjs/typeorm'
import { memoryStorage } from 'multer'
import type { Env } from '../config/env'
import { AdminMediaController } from './admin-media.controller'
import { MediaAsset } from './media-asset.entity'
import { MediaService } from './media.service'
import { MediaWorker } from './media-worker'
import { MediaUrlService } from './media-view'
import { LocalMediaStorage } from './storage/local-storage'
import { MEDIA_STORAGE } from './storage/media-storage'
import { S3MediaStorage } from './storage/s3-storage'

/* Upload, derivative generation and storage. The driver is chosen once from
   MEDIA_DRIVER; nothing else in the app knows which one is running. */
@Module({
  imports: [
    TypeOrmModule.forFeature([MediaAsset]),
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        storage: memoryStorage(),
        limits: { fileSize: config.get('MEDIA_MAX_UPLOAD_MB') * 1024 * 1024, files: 1 },
      }),
    }),
  ],
  controllers: [AdminMediaController],
  providers: [
    MediaUrlService,
    MediaWorker,
    MediaService,
    {
      provide: MEDIA_STORAGE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        config.get('MEDIA_DRIVER') === 's3'
          ? new S3MediaStorage({
              endpoint: config.get('S3_ENDPOINT'),
              region: config.get('S3_REGION') ?? 'auto',
              bucket: config.get('S3_BUCKET'),
              accessKey: config.get('S3_ACCESS_KEY'),
              secretKey: config.get('S3_SECRET_KEY'),
            })
          : new LocalMediaStorage(path.resolve(config.get('MEDIA_LOCAL_PATH'))),
    },
  ],
  exports: [MediaUrlService, MediaService, TypeOrmModule],
})
export class MediaModule {}
