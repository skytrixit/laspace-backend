import { ConflictException } from '@nestjs/common'
import type { FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm'

/** "Wardrobes & Walk-in Closets" → "wardrobes-and-walk-in-closets" */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

type Slugged = ObjectLiteral & { id: number; slug: string }

/**
 * A supplied slug must be free (409 otherwise — the admin picks another);
 * an omitted one is derived from the name and suffixed until it is free.
 * Soft-deleted rows still hold their slug: the unique index does not know
 * about deletion, and neither should the owner be surprised by it.
 */
export async function resolveSlug<T extends Slugged>(
  repo: Repository<T>,
  opts: { provided?: string; from: string; excludeId?: number },
): Promise<string> {
  const taken = async (slug: string) => {
    const row = await repo.findOne({ where: { slug } as FindOptionsWhere<T>, withDeleted: true })
    return row !== null && row.id !== opts.excludeId
  }

  if (opts.provided) {
    if (await taken(opts.provided)) {
      throw new ConflictException({
        statusCode: 409,
        code: 'slug_taken',
        message: `The address "${opts.provided}" is already in use.`,
        fields: { slug: 'Already in use — choose another.' },
      })
    }
    return opts.provided
  }

  const base = slugify(opts.from) || 'item'
  let slug = base
  for (let n = 2; await taken(slug); n++) slug = `${base}-${n}`
  return slug
}
