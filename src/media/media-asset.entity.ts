import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export const MEDIA_STATUSES = ['processing', 'ready', 'failed'] as const
export type MediaStatus = (typeof MEDIA_STATUSES)[number]

/** One derivative file: a width × format rendition of the original. */
export type MediaDerivative = {
  width: number
  height: number
  format: 'avif' | 'webp' | 'jpeg'
  key: string
  bytes: number
}

/**
 * One uploaded image. Width and height are read at upload time (header only,
 * cheap) so they are never null; the derivative set is filled in by the
 * worker and `status` flips to `ready` when it is done.
 */
@Entity('media_asset')
export class MediaAsset {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number

  @Index('uq_media_asset_storage_key', { unique: true })
  @Column({ name: 'storage_key', type: 'varchar', length: 255 })
  storageKey!: string

  @Column({ name: 'original_filename', type: 'varchar', length: 255 })
  originalFilename!: string

  @Column({ type: 'varchar', length: 64 })
  mime!: string

  @Column({ name: 'byte_size', type: 'int', unsigned: true })
  byteSize!: number

  @Column({ type: 'int', unsigned: true })
  width!: number

  @Column({ type: 'int', unsigned: true })
  height!: number

  @Column({ name: 'alt_text', type: 'varchar', length: 255, nullable: true })
  altText!: string | null

  @Column({ name: 'lqip_color', type: 'char', length: 7, nullable: true })
  lqipColor!: string | null

  @Index('idx_media_asset_status')
  @Column({ type: 'enum', enum: [...MEDIA_STATUSES], default: 'processing' })
  status!: MediaStatus

  @Column({ type: 'json', nullable: true })
  derivatives!: MediaDerivative[] | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)', onUpdate: 'CURRENT_TIMESTAMP(3)' })
  updatedAt!: Date
}
