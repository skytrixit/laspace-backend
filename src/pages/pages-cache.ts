import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import type { Request } from 'express'
import { Observable, tap } from 'rxjs'

/* ── Rendered-page cache ───────────────────────────────────────────────────
   Pages are assembled from a handful of queries and a template; caching the
   result for five minutes means the database is not touched per visit. Any
   successful admin write clears the whole cache, so an owner's edit is on
   the site with the next request — "save, refresh, it is there".
   ------------------------------------------------------------------------ */

const TTL = 5 * 60 * 1000

type Entry = { status: number; html: string; type: string; at: number }

@Injectable()
export class PagesCache {
  private readonly entries = new Map<string, Entry>()

  get(key: string): Entry | undefined {
    const hit = this.entries.get(key)
    if (!hit) return undefined
    if (Date.now() - hit.at > TTL) {
      this.entries.delete(key)
      return undefined
    }
    return hit
  }

  set(key: string, status: number, html: string, type = 'text/html; charset=utf-8') {
    this.entries.set(key, { status, html, type, at: Date.now() })
  }

  clear() {
    this.entries.clear()
  }

  get size() {
    return this.entries.size
  }
}

/** Registered globally: every successful write under /api/admin drops the rendered pages. */
@Injectable()
export class InvalidatePagesOnWrite implements NestInterceptor {
  constructor(private readonly cache: PagesCache) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<Request>()
    const isWrite = req.method !== 'GET' && req.method !== 'HEAD' && req.path.startsWith('/api/admin')
    return isWrite ? next.handle().pipe(tap(() => this.cache.clear())) : next.handle()
  }
}
