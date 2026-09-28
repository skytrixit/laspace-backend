import { randomUUID } from 'node:crypto'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggerModule } from 'nestjs-pino'
import { validateEnv } from './config/env'
import { HealthModule } from './health/health.module'
import { PrismaModule } from './prisma/prisma.module'

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

    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
