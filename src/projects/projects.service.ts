import { Injectable, UnprocessableEntityException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { ContentService } from '../common/content/content.service'
import { resolveSlug } from '../common/slug'
import { MediaAsset } from '../media/media-asset.entity'
import { MediaUrlService, type MediaView } from '../media/media-view'
import type { CreateProjectDto } from './dto/create-project.dto'
import type { ListProjectsDto } from './dto/list-projects.dto'
import type { UpdateProjectDto } from './dto/update-project.dto'
import { ProjectMedia } from './project-media.entity'
import { Project } from './project.entity'

export type ProjectView = {
  id: number
  slug: string
  title: string
  typeLabel: string | null
  categories: string[]
  location: string
  areaLabel: string | null
  yearLabel: string | null
  shortDescription: string
  fullDescription: string | null
  cover: MediaView | null
  gallery: MediaView[]
  isFeatured: boolean
  displayOrder: number
  publishedAt: Date | null
}

export type ProjectAdminView = ProjectView & { coverId: number | null; isPublished: boolean; createdAt: Date; updatedAt: Date }

@Injectable()
export class ProjectsService extends ContentService<Project> {
  protected readonly label = 'project'
  protected override relations = { cover: true, gallery: { media: true } }
  protected override readonly soft = true

  constructor(
    @InjectRepository(Project) repo: Repository<Project>,
    @InjectRepository(ProjectMedia) private readonly galleryRepo: Repository<ProjectMedia>,
    @InjectRepository(MediaAsset) private readonly mediaRepo: Repository<MediaAsset>,
    private readonly media: MediaUrlService,
  ) {
    super(repo)
  }

  toPublic = (p: Project): ProjectView => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    typeLabel: p.typeLabel,
    categories: p.categories ?? [],
    location: p.location,
    areaLabel: p.areaLabel,
    yearLabel: p.yearLabel,
    shortDescription: p.shortDescription,
    fullDescription: p.fullDescription,
    cover: this.media.view(p.cover),
    gallery: [...(p.gallery ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((entry) => this.media.view(entry.media))
      .filter((v): v is MediaView => v !== null),
    isFeatured: p.isFeatured,
    displayOrder: p.displayOrder,
    publishedAt: p.publishedAt,
  })

  toAdmin = (p: Project): ProjectAdminView => ({
    ...this.toPublic(p),
    coverId: p.coverId,
    isPublished: p.isPublished,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  })

  async createFromDto(dto: CreateProjectDto) {
    const slug = await resolveSlug(this.repo, { provided: dto.slug, from: dto.title })
    return this.create({ ...dto, slug, publishedAt: dto.isPublished ? new Date() : null })
  }

  async updateFromDto(id: number, dto: UpdateProjectDto) {
    const current = await this.getBare(id)
    const patch: Partial<Project> = { ...dto, slug: undefined }
    if (dto.slug !== undefined && dto.slug !== current.slug) {
      patch.slug = await resolveSlug(this.repo, { provided: dto.slug, from: dto.title ?? current.title, excludeId: id })
    }
    /* First time live, stamp it; unpublishing keeps the original date. */
    if (dto.isPublished && !current.publishedAt) patch.publishedAt = new Date()
    return this.update(id, patch)
  }

  override async setPublished(id: number, isPublished: boolean) {
    const current = await this.getBare(id)
    const patch: Partial<Project> = { isPublished }
    if (isPublished && !current.publishedAt) patch.publishedAt = new Date()
    return this.update(id, patch)
  }

  setFeatured(id: number, isFeatured: boolean) {
    return this.update(id, { isFeatured })
  }

  /** Replace the whole gallery. Ids must be real uploads; order is the array order. */
  async setGallery(id: number, mediaIds: number[]) {
    await this.getBare(id)
    if (mediaIds.length) {
      const found = await this.mediaRepo.findBy({ id: In(mediaIds) })
      const known = new Set(found.map((m) => m.id))
      const missing = mediaIds.filter((m) => !known.has(m))
      if (missing.length) {
        throw new UnprocessableEntityException({
          statusCode: 422,
          code: 'validation_failed',
          message: 'Some images no longer exist.',
          fields: { mediaIds: `Unknown image id(s): ${missing.join(', ')}` },
        })
      }
    }
    await this.repo.manager.transaction(async (em) => {
      await em.delete(ProjectMedia, { projectId: id })
      if (mediaIds.length) {
        await em.insert(
          ProjectMedia,
          mediaIds.map((mediaId, position) => ({ projectId: id, mediaId, position })),
        )
      }
    })
    return this.get(id)
  }

  async listPublicFiltered({ category, featured, limit }: ListProjectsDto) {
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.cover', 'cover')
      .leftJoinAndSelect('p.gallery', 'gallery')
      .leftJoinAndSelect('gallery.media', 'galleryMedia')
      .where('p.isPublished = 1')
      .orderBy('p.displayOrder', 'ASC')
      .addOrderBy('p.id', 'ASC')
      .addOrderBy('gallery.position', 'ASC')
    if (featured) qb.andWhere('p.isFeatured = 1')
    if (category) qb.andWhere('JSON_CONTAINS(p.categories, JSON_QUOTE(:category))', { category })
    if (limit) qb.take(limit)
    return qb.getMany()
  }

  async findPublicBySlug(slug: string) {
    const row = await this.repo.findOne({ where: { slug, isPublished: true }, relations: this.relations })
    if (!row) throw this.notFound()
    return row
  }
}
