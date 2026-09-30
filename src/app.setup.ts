import { existsSync } from 'node:fs'
import path from 'node:path'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import compression from 'compression'
import { static as serveStatic } from 'express'
import helmet from 'helmet'
import { AppExceptionFilter } from './common/filters/app-exception.filter'
import { validationExceptionFactory } from './common/validation'
import type { Env } from './config/env'

/* ── App configuration ─────────────────────────────────────────────────────
   Everything that shapes an HTTP request, in one place, so the e2e tests
   run the exact pipeline production does: prefix, proxy trust, headers,
   CORS, validation, error shape.
   ------------------------------------------------------------------------ */
export function configureApp(app: INestApplication) {
  const config = app.get(ConfigService<Env, true>)

  const express = app.getHttpAdapter().getInstance()
  express.disable('x-powered-by')
  /* Behind nginx or a load balancer the client IP arrives in X-Forwarded-For;
     without a proxy that header would be spoofable, so it is opt-in. */
  express.set('trust proxy', config.get('TRUST_PROXY') ? 1 : false)

  app.use(helmet({ contentSecurityPolicy: false }))
  /* Pages carry the content block and the API answers JSON: both compress well. */
  app.use(compression())

  /* The website's build: hashed assets cached for a year, everything else a
     day. Its .html files are never served raw — the pages controller injects
     the content — so they fall through to Nest. */
  const dist = path.resolve(config.get('SITE_DIST'))
  if (existsSync(dist)) {
    express.use('/assets', serveStatic(path.join(dist, 'assets'), { immutable: true, maxAge: '365d', fallthrough: false }))
    const site = serveStatic(dist, { index: false, maxAge: '1d', fallthrough: true, setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin') })
    express.use((req: { path: string }, res: unknown, next: () => void) => (req.path.endsWith('.html') ? next() : site(req as never, res as never, next)))
  }

  /* Local driver only: uploads are files on disk, served here. Derivative
     keys never change, so they are cached for a year; images must be
     embeddable from the admin and the site, hence the CORP override. */
  if (config.get('MEDIA_DRIVER') === 'local') {
    express.use(
      '/media',
      serveStatic(path.resolve(config.get('MEDIA_LOCAL_PATH'), 'media'), {
        immutable: true,
        maxAge: '365d',
        index: false,
        fallthrough: false,
        setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
      }),
    )
  }

  /* Bearer tokens, not cookies, so no credentials flag — but the admin's
     Authorization header has to be allowed through explicitly. */
  app.enableCors({
    origin: [config.get('PUBLIC_ORIGIN'), config.get('ADMIN_ORIGIN')],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['x-request-id'],
    maxAge: 600,
  })

  /* whitelist + forbidNonWhitelisted is what stops a visitor setting
     `isHandled` on their own enquiry by adding a field to the form post. */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  )
  app.useGlobalFilters(new AppExceptionFilter())
  app.enableShutdownHooks()
  return app
}
