import { Controller, Get, Param } from '@nestjs/common'
import { ServicesService } from './services.service'

/** Published services only. Drafts and deleted rows never leave this controller. */
@Controller('services')
export class PublicServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  async list() {
    return (await this.services.listPublic()).map(this.services.toPublic)
  }

  @Get(':slug')
  async get(@Param('slug') slug: string) {
    return this.services.toPublic(await this.services.findPublicBySlug(slug))
  }
}
