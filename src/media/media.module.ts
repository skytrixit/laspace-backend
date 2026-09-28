import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MediaAsset } from './media-asset.entity'
import { MediaUrlService } from './media-view'

/** Phase 4: views and URLs only. Upload, storage drivers and the derivative worker arrive in Phase 5. */
@Module({
  imports: [TypeOrmModule.forFeature([MediaAsset])],
  providers: [MediaUrlService],
  exports: [MediaUrlService, TypeOrmModule],
})
export class MediaModule {}
