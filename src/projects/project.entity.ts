import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { MediaAsset } from '../media/media-asset.entity'
import { ProjectMedia } from './project-media.entity'

@Entity('project')
@Index('idx_project_published_order', ['isPublished', 'displayOrder'])
@Index('idx_project_featured', ['isFeatured', 'isPublished', 'displayOrder'])
export class Project {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number

  @Index('uq_project_slug', { unique: true })
  @Column({ type: 'varchar', length: 120 })
  slug!: string

  @Column({ type: 'varchar', length: 160 })
  title!: string

  /** A project may sit under several filters — Kitchen and Residential. */
  @Column({ type: 'json' })
  categories!: string[]

  @Column({ type: 'varchar', length: 120 })
  location!: string

  @Column({ name: 'area_label', type: 'varchar', length: 60, nullable: true })
  areaLabel!: string | null

  @Column({ name: 'year_label', type: 'varchar', length: 10, nullable: true })
  yearLabel!: string | null

  @Column({ name: 'short_description', type: 'varchar', length: 500 })
  shortDescription!: string

  @Column({ name: 'full_description', type: 'text', nullable: true })
  fullDescription!: string | null

  @Column({ name: 'cover_id', type: 'int', unsigned: true, nullable: true })
  coverId!: number | null

  @ManyToOne(() => MediaAsset, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cover_id', foreignKeyConstraintName: 'fk_project_cover' })
  cover!: MediaAsset | null

  @OneToMany(() => ProjectMedia, (entry) => entry.project)
  gallery!: ProjectMedia[]

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured!: boolean

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished!: boolean

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number

  @Column({ name: 'published_at', type: 'datetime', precision: 3, nullable: true })
  publishedAt!: Date | null

  @Index('idx_project_deleted')
  @Column({ name: 'deleted_at', type: 'datetime', precision: 3, nullable: true })
  deletedAt!: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)', onUpdate: 'CURRENT_TIMESTAMP(3)' })
  updatedAt!: Date
}
