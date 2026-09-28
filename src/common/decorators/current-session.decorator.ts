import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { AdminSession } from '../../auth/admin-session.entity'

/** The session the guard attached, with its user loaded. Admin routes only. */
export const CurrentSession = createParamDecorator((_: unknown, ctx: ExecutionContext): AdminSession => {
  const req = ctx.switchToHttp().getRequest<{ adminSession?: AdminSession }>()
  if (!req.adminSession) throw new Error('CurrentSession used on a route the SessionGuard did not protect')
  return req.adminSession
})
