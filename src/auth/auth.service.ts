import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, LessThan, MoreThan, Not, Repository } from 'typeorm'
import type { Env } from '../config/env'
import { AdminSession } from './admin-session.entity'
import { AdminUser } from './admin-user.entity'
import { dummyHash, verifyPassword } from './password'
import { generateToken, sha256 } from './tokens'

export type PublicUser = Pick<AdminUser, 'id' | 'email' | 'displayName' | 'initials' | 'role'>

export const toPublicUser = (u: AdminUser): PublicUser => ({
  id: u.id,
  email: u.email,
  displayName: u.displayName,
  initials: u.initials,
  role: u.role,
})

const DAY = 24 * 60 * 60 * 1000
/** Without "keep me signed in": a working day plus margin. The tab closing ends it sooner client-side. */
const SHORT_TTL = 1 * DAY
/** Expired or revoked rows linger this long for audit, then go. */
const PRUNE_AFTER = 7 * DAY

type LoginInput = { email: string; password: string; remember: boolean; ip?: string; userAgent?: string }

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name)

  constructor(
    @InjectRepository(AdminUser) private readonly users: Repository<AdminUser>,
    @InjectRepository(AdminSession) private readonly sessions: Repository<AdminSession>,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async login(input: LoginInput) {
    const user = await this.users.findOne({ where: { email: input.email } })

    /* Same work whether or not the email exists, so timing reveals nothing. */
    const ok = user?.isActive
      ? await verifyPassword(user.passwordHash, input.password)
      : (await verifyPassword(await dummyHash(), input.password), false)

    if (!ok || !user) {
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'invalid_credentials',
        message: 'Those credentials do not match our records.',
      })
    }

    const { token, hash } = generateToken()
    const ttl = input.remember ? this.config.get('SESSION_TTL_DAYS') * DAY : SHORT_TTL
    const expiresAt = new Date(Date.now() + ttl)

    await this.sessions.insert({
      adminUserId: user.id,
      tokenHash: hash,
      expiresAt,
      userAgent: input.userAgent?.slice(0, 255) ?? null,
      ipHash: input.ip ? sha256(input.ip) : null,
    })
    await this.users.update(user.id, { lastLoginAt: new Date() })

    this.pruneStale().catch((err) => this.log.warn({ err }, 'session prune failed'))

    return { token, expiresAt, user: toPublicUser(user) }
  }

  /** The session for a bearer token, with its user — or null if it is unknown, expired, revoked or the user is disabled. */
  async validate(token: string): Promise<AdminSession | null> {
    const session = await this.sessions.findOne({
      where: { tokenHash: sha256(token), revokedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      relations: { user: true },
    })
    return session && session.user.isActive ? session : null
  }

  async logout(sessionId: number) {
    await this.sessions.update({ id: sessionId, revokedAt: IsNull() }, { revokedAt: new Date() })
  }

  /** Remove sessions that expired or were revoked more than a week ago. Runs after each login; no scheduler needed at one user. */
  async pruneStale() {
    const cutoff = new Date(Date.now() - PRUNE_AFTER)
    await this.sessions.delete({ expiresAt: LessThan(cutoff) })
    await this.sessions.delete({ revokedAt: Not(IsNull()) && LessThan(cutoff) })
  }
}
