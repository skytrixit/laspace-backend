import 'reflect-metadata'
import path from 'node:path'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'
import { configureApp } from './app.setup'
import type { Env } from './config/env'

async function bootstrap() {
  /* Relative paths in .env (SITE_DIST, MEDIA_LOCAL_PATH, …) resolve from the
     project root, next to package.json, however the host starts the process. */
  process.chdir(path.join(__dirname, '..'))
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  app.useLogger(app.get(Logger))
  configureApp(app)

  const port = app.get(ConfigService<Env, true>).get('PORT')
  await app.listen(port)
  app.get(Logger).log(`API listening on :${port}`)
}

bootstrap()
