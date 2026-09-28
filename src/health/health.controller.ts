import { Controller, Get, Res } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import { InjectDataSource } from '@nestjs/typeorm'
import type { Response } from 'express'
import { DataSource } from 'typeorm'

/** Uptime probe. 200 when the process and the database both answer; 503 otherwise. */
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  @Get()
  async check(@Res() res: Response) {
    let db: 'ok' | 'down' = 'ok'
    try {
      await this.db.query('SELECT 1')
    } catch {
      db = 'down'
    }
    res
      .status(db === 'ok' ? 200 : 503)
      .json({ status: db === 'ok' ? 'ok' : 'degraded', db, uptime: Math.round(process.uptime()) })
  }
}
