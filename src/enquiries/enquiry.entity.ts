import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export const ENQUIRY_SOURCES = [
  'website_form',
  'consultation_modal',
  'instagram',
  'referral',
  'google',
  'whatsapp',
  'other',
] as const
export type EnquirySource = (typeof ENQUIRY_SOURCES)[number]

/**
 * The one visitor-generated table. Service and budget are kept as the labels
 * the visitor chose; email is nullable because the consultation modal does
 * not collect it.
 */
@Entity('enquiry')
@Index('idx_enquiry_handled_submitted', ['isHandled', 'submittedAt'])
export class Enquiry {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number

  @Index('uq_enquiry_reference_code', { unique: true })
  @Column({ name: 'reference_code', type: 'char', length: 10 })
  referenceCode!: string

  @Column({ type: 'varchar', length: 120 })
  name!: string

  @Index('idx_enquiry_phone')
  @Column({ type: 'varchar', length: 32 })
  phone!: string

  @Column({ type: 'varchar', length: 190, nullable: true })
  email!: string | null

  @Column({ name: 'service_label', type: 'varchar', length: 120 })
  serviceLabel!: string

  @Column({ name: 'budget_label', type: 'varchar', length: 60, nullable: true })
  budgetLabel!: string | null

  @Column({ type: 'text', nullable: true })
  message!: string | null

  @Column({ type: 'enum', enum: [...ENQUIRY_SOURCES] })
  source!: EnquirySource

  @Column({ name: 'is_handled', type: 'boolean', default: false })
  isHandled!: boolean

  @Column({ name: 'handled_at', type: 'datetime', precision: 3, nullable: true })
  handledAt!: Date | null

  @Column({ name: 'notified_at', type: 'datetime', precision: 3, nullable: true })
  notifiedAt!: Date | null

  @Column({ name: 'ip_hash', type: 'char', length: 64, nullable: true })
  ipHash!: string | null

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent!: string | null

  @Index('idx_enquiry_submitted')
  @Column({ name: 'submitted_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  submittedAt!: Date

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)', onUpdate: 'CURRENT_TIMESTAMP(3)' })
  updatedAt!: Date
}
