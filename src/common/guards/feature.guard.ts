import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import type { Env } from '../../config/env'
import { featuresOf, type FeatureName } from '../../config/features'
import { FEATURE_KEY } from '../decorators/feature.decorator'

/* ── Feature guard ─────────────────────────────────────────────────────────
   Registered globally, after the session guard, so a locked section still
   asks for a sign-in first and only then says it is locked. Routes without
   an @Feature() mark pass through untouched.
   ------------------------------------------------------------------------ */

export const locked = () =>
  new ForbiddenException({ statusCode: 403, code: 'feature_locked', message: 'This section is not enabled for this account.' })

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService<Env, true>,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const name = this.reflector.getAllAndOverride<FeatureName | undefined>(FEATURE_KEY, [ctx.getHandler(), ctx.getClass()])
    if (!name) return true
    if (!featuresOf(this.config)[name]) throw locked()
    return true
  }
}
