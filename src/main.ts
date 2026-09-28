import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import helmet from 'helmet'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'
import { AppExceptionFilter } from './common/filters/app-exception.filter'
import { validationExceptionFactory } from './common/validation'
import type { Env } from './config/env'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.useLogger(app.get(Logger))

  const config = app.get(ConfigService<Env, true>)

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

  const port = config.get('PORT')
  await app.listen(port)
  app.get(Logger).log(`API listening on :${port}`)
}

bootstrap()
