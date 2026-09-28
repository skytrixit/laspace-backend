import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type { SiteSettingsDto } from './dto/site-settings.dto'
import { SiteSetting } from './site-setting.entity'

const ROW_ID = 1

/** Exactly one row. A fresh database gets a blank one on first read rather than a 404. */
@Injectable()
export class SettingsService {
  constructor(@InjectRepository(SiteSetting) private readonly repo: Repository<SiteSetting>) {}

  async get(): Promise<SiteSetting> {
    const row = await this.repo.findOneBy({ id: ROW_ID })
    if (row) return row
    return this.repo.save(
      this.repo.create({
        id: ROW_ID,
        phone: '',
        phoneHref: 'tel:',
        whatsappHref: '',
        email: '',
        addressLine1: '',
        hours: '',
      }),
    )
  }

  async update(dto: SiteSettingsDto): Promise<SiteSetting> {
    const row = await this.get()
    Object.assign(row, dto)
    return this.repo.save(row)
  }
}
