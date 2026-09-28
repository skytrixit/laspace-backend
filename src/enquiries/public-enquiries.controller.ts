import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import type { Request, Response } from 'express'
import { CreateEnquiryDto } from './dto/create-enquiry.dto'
import { EnquiriesService } from './enquiries.service'
import { referenceCode } from './reference-code'

/** Under two seconds from render to submit is not a person reading a form. */
const MIN_FILL_MS = 2000

@Controller('enquiries')
export class PublicEnquiriesController {
  constructor(private readonly enquiries: EnquiriesService) {}

  /** The one public write. 5 per hour per IP; failures beyond that fall back to mailto on the site. */
  @Post()
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } })
  async create(@Body() dto: CreateEnquiryDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    /* Bots get a convincing success and nothing is stored. */
    const tooFast = dto.formTs !== undefined && Date.now() - dto.formTs < MIN_FILL_MS
    if (dto.website || tooFast) return { referenceCode: referenceCode(), receivedAt: new Date() }

    const { duplicate, ...result } = await this.enquiries.submit(dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
    if (duplicate) res.status(200)
    return result
  }
}
