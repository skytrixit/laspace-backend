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

@Entity('brand')
@Index('idx_brand_published_order', ['isPublished', 'displayOrder'])
export class Brand {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number

  @Column({ type: 'varchar', length: 120 })
  name!: string

  @Column({ name: 'website_url', type: 'varchar', length: 255, nullable: true })
  websiteUrl!: string | null

  @Column({ name: 'logo_id', type: 'int', unsigned: true, nullable: true })
  logoId!: number | null

  @ManyToOne(() => MediaAsset, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'logo_id', foreignKeyConstraintName: 'fk_brand_logo' })
  logo!: MediaAsset | null

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished!: boolean

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)', onUpdate: 'CURRENT_TIMESTAMP(3)' })
  updatedAt!: Date
}
