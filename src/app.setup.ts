import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import compression from 'compression'
import { static as serveStatic, type NextFunction, type Request, type Response } from 'express'
import helmet from 'helmet'
import { SHELL_CSS, trackingScript } from './pages/html'
import { cspDirectives, inlineBlocks } from './security/csp'
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

  /* Security headers. The CSP allows the inline blocks the builds and this
     server emit by hash; see src/security/csp.ts. */
  const dist = path.resolve(config.get('SITE_DIST'))
  const adminDist = path.resolve(config.get('ADMIN_DIST'))
  const templates = [
    ...(existsSync(dist) ? readdirSync(dist).filter((f) => f.endsWith('.html')).map((f) => readFileSync(path.join(dist, f), 'utf8')) : []),
    ...(existsSync(path.join(adminDist, 'index.html')) ? [readFileSync(path.join(adminDist, 'index.html'), 'utf8')] : []),
  ]
  const ga4Id = config.get('GA4_MEASUREMENT_ID')
  app.use(
    helmet({
      /* The browser's own default: the full referrer within the site (the home
         page's entry loader needs it to tell an in-site visit from an arrival),
         only the origin to other sites, nothing from HTTPS to HTTP. */
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      contentSecurityPolicy: {
        useDefaults: false,
        directives: cspDirectives({
          production: config.get('NODE_ENV') === 'production',
          cdnBaseUrl: config.get('CDN_BASE_URL'),
          ga4Id,
          inlineScripts: [...(ga4Id ? [trackingScript(ga4Id)] : []), ...templates.flatMap((t) => inlineBlocks(t, 'script'))],
          inlineStyles: [SHELL_CSS, ...templates.flatMap((t) => inlineBlocks(t, 'style'))],
        }),
      },
    }),
  )
  /* Pages carry the content block and the API answers JSON: both compress well. */
  app.use(compression())

  /* The website's build: hashed assets cached for a year, everything else a
     day. Its .html files are never served raw — the pages controller injects
     the content — so they fall through to Nest. */
  if (existsSync(dist)) {
    express.use('/assets', serveStatic(path.join(dist, 'assets'), { immutable: true, maxAge: '365d', fallthrough: false }))
    const site = serveStatic(dist, { index: false, maxAge: '1d', fallthrough: true, setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin') })
    express.use((req: { path: string }, res: unknown, next: () => void) => (req.path.endsWith('.html') ? next() : site(req as never, res as never, next)))
  }

  /* The admin build at /admin: hashed assets immutable, index.html never
     cached, and any /admin route without a file extension gets index.html —
     the panel's router takes it from there, so a deep link works on a fresh
     load. Missing assets stay 404s. */
  const adminIndex = path.join(adminDist, 'index.html')
  if (existsSync(adminIndex)) {
    express.use('/admin/assets', serveStatic(path.join(adminDist, 'assets'), { immutable: true, maxAge: '365d', fallthrough: false }))
    express.use('/admin', serveStatic(adminDist, { index: false, redirect: false, maxAge: '1d', fallthrough: true }))
    express.use((req: Request, res: Response, next: NextFunction) => {
      const spaRoute = (req.path === '/admin' || req.path.startsWith('/admin/')) && !path.extname(req.path)
      if (!spaRoute || (req.method !== 'GET' && req.method !== 'HEAD')) return next()
      res.setHeader('Cache-Control', 'no-cache')
      res.sendFile(adminIndex)
    })
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
