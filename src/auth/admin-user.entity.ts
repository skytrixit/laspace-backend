import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { AdminSession } from './admin-session.entity'

export const ADMIN_ROLES = ['owner'] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

@Entity('admin_user')
export class AdminUser {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number

  @Index('uq_admin_user_email', { unique: true })
  @Column({ type: 'varchar', length: 190 })
  email!: string

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string

  @Column({ name: 'display_name', type: 'varchar', length: 120 })
  displayName!: string

  @Column({ type: 'char', length: 2 })
  initials!: string

  @Column({ type: 'enum', enum: [...ADMIN_ROLES], default: 'owner' })
  role!: AdminRole

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean

  @Column({ name: 'last_login_at', type: 'datetime', precision: 3, nullable: true })
  lastLoginAt!: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)', onUpdate: 'CURRENT_TIMESTAMP(3)' })
  updatedAt!: Date

  @OneToMany(() => AdminSession, (session) => session.user)
  sessions!: AdminSession[]
}
