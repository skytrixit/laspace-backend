import { INestApplication, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
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

  /* /api/... for everything except the health probe (and, later, the public pages). */
  app.setGlobalPrefix('api', { exclude: ['health'] })

  const express = app.getHttpAdapter().getInstance()
  express.disable('x-powered-by')
  /* Behind nginx or a load balancer the client IP arrives in X-Forwarded-For;
     without a proxy that header would be spoofable, so it is opt-in. */
  express.set('trust proxy', config.get('TRUST_PROXY') ? 1 : false)

  app.use(helmet())

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
