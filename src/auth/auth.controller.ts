import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import type { Request } from 'express'
import { CurrentSession } from '../common/decorators/current-session.decorator'
import { Public } from '../common/decorators/public.decorator'
import type { AdminSession } from './admin-session.entity'
import { AuthService, toPublicUser } from './auth.service'
import { LoginDto } from './dto/login.dto'

@Controller('admin/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** 5 attempts per 15 minutes per IP, success or failure. */
  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login({ ...dto, ip: req.ip, userAgent: req.headers['user-agent'] })
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@CurrentSession() session: AdminSession) {
    await this.auth.logout(session.id)
  }

  @Get('me')
  me(@CurrentSession() session: AdminSession) {
    return { user: toPublicUser(session.user), expiresAt: session.expiresAt }
  }
}
