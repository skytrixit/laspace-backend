import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ContentService } from '../common/content/content.service'
import { resolveSlug } from '../common/slug'
import { MediaUrlService, type MediaView } from '../media/media-view'
import type { CreateServiceDto } from './dto/create-service.dto'
import type { UpdateServiceDto } from './dto/update-service.dto'
import { Service } from './service.entity'

export type ServiceView = {
  id: number
  slug: string
  name: string
  shortDescription: string
  fullDescription: string | null
  inclusions: string[]
  image: MediaView | null
  displayOrder: number
}

export type ServiceAdminView = ServiceView & {
  imageId: number | null
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class ServicesService extends ContentService<Service> {
  protected readonly label = 'service'
  protected override relations = { image: true }
  protected override readonly soft = true

  constructor(
    @InjectRepository(Service) repo: Repository<Service>,
    private readonly media: MediaUrlService,
  ) {
    super(repo)
  }

  toPublic = (s: Service): ServiceView => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    shortDescription: s.shortDescription,
    fullDescription: s.fullDescription,
    inclusions: s.inclusions ?? [],
    image: this.media.view(s.image),
    displayOrder: s.displayOrder,
  })

  toAdmin = (s: Service): ServiceAdminView => ({
    ...this.toPublic(s),
    imageId: s.imageId,
    isPublished: s.isPublished,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  })

  async createFromDto(dto: CreateServiceDto) {
    const slug = await resolveSlug(this.repo, { provided: dto.slug, from: dto.name })
    return this.create({ ...dto, slug })
  }

  async updateFromDto(id: number, dto: UpdateServiceDto) {
    const current = await this.getBare(id)
    const slug =
      dto.slug !== undefined && dto.slug !== current.slug
        ? await resolveSlug(this.repo, { provided: dto.slug, from: dto.name ?? current.name, excludeId: id })
        : undefined
    return this.update(id, slug ? { ...dto, slug } : { ...dto, slug: undefined })
  }

  async findPublicBySlug(slug: string) {
    const row = await this.repo.findOne({ where: { slug, isPublished: true }, relations: this.relations })
    if (!row) throw this.notFound()
    return row
  }
}
