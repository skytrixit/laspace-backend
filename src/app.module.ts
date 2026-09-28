import { randomUUID } from 'node:crypto'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerModule } from 'nestjs-pino'
import { Env, validateEnv } from './config/env'
import { dataSourceOptions } from './database/data-source'
import { HealthModule } from './health/health.module'

const isDev = process.env.NODE_ENV !== 'production'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),

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

    HealthModule,
  ],
})
export class AppModule {}
