import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { MediaAsset } from '../media/media-asset.entity'

@Entity('service')
@Index('idx_service_published_order', ['isPublished', 'displayOrder'])
export class Service {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number

  @Index('uq_service_slug', { unique: true })
  @Column({ type: 'varchar', length: 120 })
  slug!: string

  @Column({ type: 'varchar', length: 120 })
  name!: string

  @Column({ name: 'short_description', type: 'varchar', length: 500 })
  shortDescription!: string

  @Column({ name: 'full_description', type: 'text', nullable: true })
  fullDescription!: string | null

  /** The "What's included" list, written whole by the admin. */
  @Column({ type: 'json' })
  inclusions!: string[]

  @Column({ name: 'image_id', type: 'int', unsigned: true, nullable: true })
  imageId!: number | null

  @ManyToOne(() => MediaAsset, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'image_id', foreignKeyConstraintName: 'fk_service_image' })
  image!: MediaAsset | null

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished!: boolean

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number

  @Index('idx_service_deleted')
  @Column({ name: 'deleted_at', type: 'datetime', precision: 3, nullable: true })
  deletedAt!: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)', onUpdate: 'CURRENT_TIMESTAMP(3)' })
  updatedAt!: Date
}
