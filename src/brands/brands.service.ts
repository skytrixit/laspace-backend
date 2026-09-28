import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ContentService } from '../common/content/content.service'
import { MediaUrlService, type MediaView } from '../media/media-view'
import { Brand } from './brand.entity'

export type BrandView = { id: number; name: string; websiteUrl: string | null; logo: MediaView | null; displayOrder: number }
export type BrandAdminView = BrandView & { logoId: number | null; isPublished: boolean; createdAt: Date; updatedAt: Date }

@Injectable()
export class BrandsService extends ContentService<Brand> {
  protected readonly label = 'brand'
  protected override relations = { logo: true }

  constructor(
    @InjectRepository(Brand) repo: Repository<Brand>,
    private readonly media: MediaUrlService,
  ) {
    super(repo)
  }

  toPublic = (b: Brand): BrandView => ({
    id: b.id,
    name: b.name,
    websiteUrl: b.websiteUrl,
    logo: this.media.view(b.logo),
    displayOrder: b.displayOrder,
  })

  toAdmin = (b: Brand): BrandAdminView => ({
    ...this.toPublic(b),
    logoId: b.logoId,
    isPublished: b.isPublished,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  })
}
