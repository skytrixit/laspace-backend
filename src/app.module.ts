import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD, RouterModule } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerModule } from 'nestjs-pino'
import { AuthModule } from './auth/auth.module'
import { BrandsModule } from './brands/brands.module'
import { EnquiriesModule } from './enquiries/enquiries.module'
import { FaqsModule } from './faqs/faqs.module'
import { MediaModule } from './media/media.module'
import { PagesModule } from './pages/pages.module'
import { ProjectsModule } from './projects/projects.module'
import { ServicesModule } from './services/services.module'
import { SettingsModule } from './settings/settings.module'
import { TestimonialsModule } from './testimonials/testimonials.module'
import { FeatureGuard } from './common/guards/feature.guard'
import { SessionGuard } from './common/guards/session.guard'
import { Env, validateEnv } from './config/env'
import { dataSourceOptions } from './database/data-source'
import { HealthModule } from './health/health.module'

const isDev = process.env.NODE_ENV !== 'production'

@Module({
  imports: [
    /* .env sits at the project root, next to package.json. Anchored to this
       file rather than process.cwd(): the path is computed at import time,
       before main.ts changes directory. Missing file → process env only. */
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv, envFilePath: path.resolve(__dirname, '..', '.env') }),

    /* Structured request logs with a request id from day one. Incoming
       x-request-id is honoured so a proxy's id carries through; otherwise
       one is minted. Authorization headers never reach the log. */
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req, res) => {
          const incoming = req.headers['x-request-id']
          const id = typeof incoming === 'string' && incoming.length <= 64 ? incoming : randomUUID()
          res.setHeader('x-request-id', id)
          return id
        },
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        autoLogging: { ignore: (req) => req.url === '/health' },
        transport: isDev ? { target: 'pino-pretty', options: { singleLine: true } } : undefined,
      },
    }),

    /* The API connects as the app user — rows only, never schema. */
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        dataSourceOptions(
          {
            DB_HOST: config.get('DB_HOST'),
            DB_PORT: config.get('DB_PORT'),
            DB_NAME: config.get('DB_NAME'),
            DB_USERNAME: config.get('DB_USERNAME'),
            DB_PASSWORD: config.get('DB_PASSWORD'),
          },
          'app',
        ),
    }),

    /* A generous ceiling on everything; login and the enquiry form set
       their own much lower limits with @Throttle. */
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60 * 1000, limit: 120 }]),

    AuthModule,
    EnquiriesModule,
    ServicesModule,
    ProjectsModule,
    TestimonialsModule,
    BrandsModule,
    FaqsModule,
    SettingsModule,
    /* The API lives under /api; the public pages (PagesModule) and the health probe sit at the root. */
    RouterModule.register([
      { path: 'api', children: [AuthModule, EnquiriesModule, ServicesModule, ProjectsModule, TestimonialsModule, BrandsModule, FaqsModule, SettingsModule, MediaModule] },
    ]),
    PagesModule,
    HealthModule,
  ],
  providers: [
    /* Order matters: the cheap rate limit runs before the database lookup. */
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: SessionGuard },
    /* After the session guard: a locked section still asks for a sign-in first. */
    { provide: APP_GUARD, useClass: FeatureGuard },
  ],
})
export class AppModule {}
