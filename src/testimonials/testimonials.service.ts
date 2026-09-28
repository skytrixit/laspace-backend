import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ContentService } from '../common/content/content.service'
import { MediaUrlService, type MediaView } from '../media/media-view'
import { Testimonial } from './testimonial.entity'

export type TestimonialView = {
  id: number
  customerName: string
  attribution: string | null
  quote: string
  photo: MediaView | null
  displayOrder: number
}

export type TestimonialAdminView = TestimonialView & { photoId: number | null; isPublished: boolean; createdAt: Date; updatedAt: Date }

@Injectable()
export class TestimonialsService extends ContentService<Testimonial> {
  protected readonly label = 'testimonial'
  protected override relations = { photo: true }

  constructor(
    @InjectRepository(Testimonial) repo: Repository<Testimonial>,
    private readonly media: MediaUrlService,
  ) {
    super(repo)
  }

  toPublic = (t: Testimonial): TestimonialView => ({
    id: t.id,
    customerName: t.customerName,
    attribution: t.attribution,
    quote: t.quote,
    photo: this.media.view(t.photo),
    displayOrder: t.displayOrder,
  })

  toAdmin = (t: Testimonial): TestimonialAdminView => ({
    ...this.toPublic(t),
    photoId: t.photoId,
    isPublished: t.isPublished,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  })
}
