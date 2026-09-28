import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Brackets, MoreThan, Repository } from 'typeorm'
import { sha256 } from '../auth/tokens'
import { MailService } from '../mail/mail.service'
import type { CreateEnquiryDto } from './dto/create-enquiry.dto'
import type { ListEnquiriesDto } from './dto/list-enquiries.dto'
import { Enquiry } from './enquiry.entity'
import { referenceCode } from './reference-code'

/** A double-click or a retried request within this window returns the first enquiry. */
const DUPLICATE_WINDOW = 60 * 1000
const WEEK = 7 * 24 * 60 * 60 * 1000

/** What the admin sees. Hashed IPs and user agents stay in the database. */
export type EnquiryView = Omit<Enquiry, 'ipHash' | 'userAgent'>

export const toView = ({ ipHash: _ip, userAgent: _ua, ...rest }: Enquiry): EnquiryView => rest

const notFound = () => new NotFoundException({ statusCode: 404, code: 'not_found', message: 'No such enquiry.' })

@Injectable()
export class EnquiriesService {
  private readonly log = new Logger(EnquiriesService.name)

  constructor(
    @InjectRepository(Enquiry) private readonly repo: Repository<Enquiry>,
    private readonly mail: MailService,
  ) {}

  /* ── Public ─────────────────────────────────────────────────────────── */

  async submit(dto: CreateEnquiryDto, meta: { ip?: string; userAgent?: string }) {
    const recent = await this.repo.findOne({
      where: { phone: dto.phone, serviceLabel: dto.service, submittedAt: MoreThan(new Date(Date.now() - DUPLICATE_WINDOW)) },
      order: { submittedAt: 'DESC' },
    })
    if (recent) return { referenceCode: recent.referenceCode, receivedAt: recent.submittedAt, duplicate: true }

    const enquiry = this.repo.create({
      referenceCode: await this.uniqueReference(),
      name: dto.name,
      phone: dto.phone,
      email: dto.email ?? null,
      serviceLabel: dto.service,
      budgetLabel: dto.budget ?? null,
      message: dto.message ?? null,
      source: dto.source,
      ipHash: meta.ip ? sha256(meta.ip) : null,
      userAgent: meta.userAgent?.slice(0, 255) ?? null,
      submittedAt: new Date(),
    })
    await this.repo.save(enquiry)

    /* Fire and forget: the visitor's request never waits on SMTP. */
    this.notify(enquiry)

    return { referenceCode: enquiry.referenceCode, receivedAt: enquiry.submittedAt, duplicate: false }
  }

  private notify(enquiry: Enquiry) {
    this.mail
      .sendEnquiryAlert(enquiry)
      .then((outcome) => {
        if (outcome === 'sent') return this.repo.update(enquiry.id, { notifiedAt: new Date() })
        if (outcome === 'failed') this.log.error({ reference: enquiry.referenceCode }, 'enquiry alert not delivered')
      })
      .catch((err) => this.log.error({ err }, 'enquiry alert crashed'))
  }

  private async uniqueReference() {
    for (let i = 0; i < 5; i++) {
      const code = referenceCode()
      if (!(await this.repo.existsBy({ referenceCode: code }))) return code
    }
    throw new Error('Could not allocate a unique reference code')
  }

  /* ── Admin ──────────────────────────────────────────────────────────── */

  async list({ page, pageSize, q, handled }: ListEnquiriesDto) {
    const qb = this.repo.createQueryBuilder('e')
    if (handled !== 'all') qb.andWhere('e.isHandled = :h', { h: handled === 'handled' })
    if (q) {
      qb.andWhere(
        new Brackets((w) =>
          w
            .where('e.name LIKE :q', { q: `%${q}%` })
            .orWhere('e.phone LIKE :q')
            .orWhere('e.email LIKE :q')
            .orWhere('e.serviceLabel LIKE :q'),
        ),
      )
    }
    const [rows, total] = await qb
      .orderBy('e.submittedAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount()
    return { items: rows.map(toView), page, pageSize, total }
  }

  async summary() {
    const [total, unhandled, thisWeek, latest] = await Promise.all([
      this.repo.count(),
      this.repo.countBy({ isHandled: false }),
      this.repo.countBy({ submittedAt: MoreThan(new Date(Date.now() - WEEK)) }),
      this.repo.find({ order: { submittedAt: 'DESC' }, take: 5 }),
    ])
    return { total, unhandled, thisWeek, latest: latest.map(toView) }
  }

  async get(id: number) {
    const row = await this.repo.findOneBy({ id })
    if (!row) throw notFound()
    return toView(row)
  }

  async setHandled(id: number, isHandled: boolean) {
    const row = await this.repo.findOneBy({ id })
    if (!row) throw notFound()
    row.isHandled = isHandled
    row.handledAt = isHandled ? new Date() : null
    await this.repo.save(row)
    return toView(row)
  }

  async remove(id: number) {
    const { affected } = await this.repo.delete({ id })
    if (!affected) throw notFound()
  }
}
