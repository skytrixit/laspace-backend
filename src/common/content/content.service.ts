import { NotFoundException } from '@nestjs/common'
import type { DeepPartial, FindOptionsOrder, FindOptionsRelations, FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm'

/* ── Ordered, publishable content ──────────────────────────────────────────
   Services, projects, testimonials, brands and FAQs are the same shape from
   the admin's side: an ordered list, each row draft or live, edited one at a
   time. This base holds that shape once. Subclasses add relations, slugs
   and anything only they need.
   ------------------------------------------------------------------------ */

export interface ContentEntity extends ObjectLiteral {
  id: number
  isPublished: boolean
  displayOrder: number
}

export abstract class ContentService<T extends ContentEntity> {
  /** For error messages: "No such service." */
  protected abstract readonly label: string
  /** Relations to load on reads; mutations reload without them. */
  protected relations: FindOptionsRelations<T> = {}
  /** Soft delete needs a @DeleteDateColumn on the entity. */
  protected readonly soft: boolean = false

  constructor(protected readonly repo: Repository<T>) {}

  protected notFound() {
    return new NotFoundException({ statusCode: 404, code: 'not_found', message: `No such ${this.label}.` })
  }

  protected get order(): FindOptionsOrder<T> {
    return { displayOrder: 'ASC', id: 'ASC' } as FindOptionsOrder<T>
  }

  listAdmin(): Promise<T[]> {
    return this.repo.find({ relations: this.relations, order: this.order })
  }

  listPublic(): Promise<T[]> {
    return this.repo.find({
      where: { isPublished: true } as FindOptionsWhere<T>,
      relations: this.relations,
      order: this.order,
    })
  }

  async get(id: number): Promise<T> {
    const row = await this.repo.findOne({ where: { id } as FindOptionsWhere<T>, relations: this.relations })
    if (!row) throw this.notFound()
    return row
  }

  /** Without relations, so saving a changed foreign key is not overridden by a stale loaded object. */
  protected async getBare(id: number): Promise<T> {
    const row = await this.repo.findOne({ where: { id } as FindOptionsWhere<T> })
    if (!row) throw this.notFound()
    return row
  }

  async create(data: DeepPartial<T>): Promise<T> {
    if (data.displayOrder === undefined || data.displayOrder === null) {
      data = { ...data, displayOrder: (await this.maxOrder()) + 1 }
    }
    const row = await this.repo.save(this.repo.create(data))
    return this.get(row.id)
  }

  async update(id: number, data: DeepPartial<T>): Promise<T> {
    const row = await this.getBare(id)
    Object.assign(row, data)
    await this.repo.save(row)
    return this.get(id)
  }

  setPublished(id: number, isPublished: boolean): Promise<T> {
    return this.update(id, { isPublished } as DeepPartial<T>)
  }

  async remove(id: number): Promise<void> {
    await this.getBare(id)
    if (this.soft) await this.repo.softDelete(id)
    else await this.repo.delete(id)
  }

  /** Position in `ids` becomes display order; rows not listed keep theirs. */
  async reorder(ids: number[]): Promise<T[]> {
    await this.repo.manager.transaction(async (em) => {
      for (const [index, id] of ids.entries()) {
        await em.update(this.repo.target, { id } as FindOptionsWhere<T>, { displayOrder: index + 1 } as never)
      }
    })
    return this.listAdmin()
  }

  private async maxOrder(): Promise<number> {
    const raw = await this.repo.createQueryBuilder('e').select('MAX(e.displayOrder)', 'max').getRawOne<{ max: number | null }>()
    return Number(raw?.max ?? 0)
  }
}
