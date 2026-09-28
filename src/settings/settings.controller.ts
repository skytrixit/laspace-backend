import { Body, Controller, Get, Put } from '@nestjs/common'
import { SiteSettingsDto } from './dto/site-settings.dto'
import { SettingsService } from './settings.service'

/** Footer and contact details are public by nature — this is the same row the site prints. */
@Controller('site-settings')
export class PublicSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get() {
    return this.settings.get()
  }
}

@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get() {
    return this.settings.get()
  }

  @Put()
  update(@Body() dto: SiteSettingsDto) {
    return this.settings.update(dto)
  }
}
