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

@Entity('testimonial')
@Index('idx_testimonial_published_order', ['isPublished', 'displayOrder'])
export class Testimonial {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number

  @Column({ name: 'customer_name', type: 'varchar', length: 120 })
  customerName!: string

  /** Location or project reference, free text. */
  @Column({ type: 'varchar', length: 160, nullable: true })
  attribution!: string | null

  @Column({ type: 'text' })
  quote!: string

  @Column({ name: 'photo_id', type: 'int', unsigned: true, nullable: true })
  photoId!: number | null

  @ManyToOne(() => MediaAsset, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'photo_id', foreignKeyConstraintName: 'fk_testimonial_photo' })
  photo!: MediaAsset | null

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished!: boolean

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)', onUpdate: 'CURRENT_TIMESTAMP(3)' })
  updatedAt!: Date
}
