import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Throttle } from '@nestjs/throttler'
import type { Request } from 'express'
import { CurrentSession } from '../common/decorators/current-session.decorator'
import { Public } from '../common/decorators/public.decorator'
import type { Env } from '../config/env'
import { featuresOf, type Features } from '../config/features'
import type { AdminSession } from './admin-session.entity'
import { AuthService, toPublicUser } from './auth.service'
import { LoginDto } from './dto/login.dto'

@Controller('admin/auth')
export class AuthController {
  /* Which admin sections this deployment has switched on. Sent with every
     sign-in so the panel can hide what the API would refuse anyway. */
  private readonly features: Features

  constructor(
    private readonly auth: AuthService,
    config: ConfigService<Env, true>,
  ) {
    this.features = featuresOf(config)
  }

  /** 5 attempts per 15 minutes per IP, success or failure. */
  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const result = await this.auth.login({ ...dto, ip: req.ip, userAgent: req.headers['user-agent'] })
    return { ...result, features: this.features }
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@CurrentSession() session: AdminSession) {
    await this.auth.logout(session.id)
  }

  @Get('me')
  me(@CurrentSession() session: AdminSession) {
    return { user: toPublicUser(session.user), expiresAt: session.expiresAt, features: this.features }
  }
}
