import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('faq')
@Index('idx_faq_published_order', ['isPublished', 'displayOrder'])
export class Faq {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number

  @Column({ type: 'varchar', length: 255 })
  question!: string

  @Column({ type: 'text' })
  answer!: string

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished!: boolean

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date
}
