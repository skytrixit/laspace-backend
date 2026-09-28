import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import type { AdminSession } from '../../auth/admin-session.entity'
import { AuthService } from '../../auth/auth.service'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

/* ── Session guard ─────────────────────────────────────────────────────────
   Registered globally. Anything under /api/admin needs a valid bearer token
   unless the handler is marked @Public(). Everything else passes through.
   Secure by default: a new admin controller is protected without anyone
   remembering to add a decorator.
   ------------------------------------------------------------------------ */

const ADMIN_PREFIX = '/api/admin'

const unauthorized = () =>
  new UnauthorizedException({ statusCode: 401, code: 'unauthorized', message: 'Sign in to continue.' })

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request & { adminSession?: AdminSession }>()
    if (!req.path.startsWith(ADMIN_PREFIX)) return true

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ])
    if (isPublic) return true

    const [scheme, token] = (req.headers.authorization ?? '').split(' ')
    if (scheme !== 'Bearer' || !token) throw unauthorized()

    const session = await this.auth.validate(token)
    if (!session) throw unauthorized()

    req.adminSession = session
    return true
  }
}
