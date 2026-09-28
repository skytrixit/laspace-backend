import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ContentService } from '../common/content/content.service'
import { Faq } from './faq.entity'

export type FaqView = { id: number; question: string; answer: string; displayOrder: number }
export type FaqAdminView = FaqView & { isPublished: boolean; createdAt: Date; updatedAt: Date }

@Injectable()
export class FaqsService extends ContentService<Faq> {
  protected readonly label = 'FAQ'

  constructor(@InjectRepository(Faq) repo: Repository<Faq>) {
    super(repo)
  }

  toPublic = (f: Faq): FaqView => ({ id: f.id, question: f.question, answer: f.answer, displayOrder: f.displayOrder })

  toAdmin = (f: Faq): FaqAdminView => ({ ...this.toPublic(f), isPublished: f.isPublished, createdAt: f.createdAt, updatedAt: f.updatedAt })
}
