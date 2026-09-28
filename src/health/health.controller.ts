import { Controller, Get, HttpCode, Res } from '@nestjs/common'
import type { Response } from 'express'
import { PrismaService } from '../prisma/prisma.service'

/** Uptime probe. 200 when the process and the database both answer; 503 otherwise. */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(200)
  async check(@Res() res: Response) {
    let db: 'ok' | 'down' = 'ok'
    try {
      await this.prisma.$queryRaw`SELECT 1`
    } catch {
      db = 'down'
    }
    const body = { status: db === 'ok' ? 'ok' : 'degraded', db, uptime: Math.round(process.uptime()) }
    res.status(db === 'ok' ? 200 : 503).json(body)
  }
}
