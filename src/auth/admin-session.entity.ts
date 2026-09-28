import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { AdminUser } from './admin-user.entity'

/** One row per live bearer token. Only the token's SHA-256 is stored. */
@Entity('admin_session')
export class AdminSession {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id!: number

  @Index('idx_admin_session_user')
  @Column({ name: 'admin_user_id', type: 'int', unsigned: true })
  adminUserId!: number

  @Index('uq_admin_session_token_hash', { unique: true })
  @Column({ name: 'token_hash', type: 'char', length: 64 })
  tokenHash!: string

  @Index('idx_admin_session_expires')
  @Column({ name: 'expires_at', type: 'datetime', precision: 3 })
  expiresAt!: Date

  @Column({ name: 'revoked_at', type: 'datetime', precision: 3, nullable: true })
  revokedAt!: Date | null

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent!: string | null

  @Column({ name: 'ip_hash', type: 'char', length: 64, nullable: true })
  ipHash!: string | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date

  @ManyToOne(() => AdminUser, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_user_id', foreignKeyConstraintName: 'fk_admin_session_user' })
  user!: AdminUser
}
