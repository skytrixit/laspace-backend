import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import nodemailer, { type Transporter } from 'nodemailer'
import type { Env } from '../config/env'
import type { Enquiry } from '../enquiries/enquiry.entity'

/* ── Enquiry alerts ────────────────────────────────────────────────────────
   Nodemailer over SMTP, plain text only — the message body is free input
   from a stranger and never goes near HTML. Not configured = skipped, with a
   warning at boot, so the API runs before the studio mailbox is known.
   ------------------------------------------------------------------------ */

export type AlertOutcome = 'sent' | 'skipped' | 'failed'

const ATTEMPTS = 3
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const SOURCE_LABEL: Record<Enquiry['source'], string> = {
  website_form: 'the contact page form',
  consultation_modal: 'the "Book a Consultation" dialog',
  instagram: 'Instagram',
  referral: 'a referral',
  google: 'Google',
  whatsapp: 'WhatsApp',
  other: 'another source',
}

/** Pure: the message for one enquiry. Tested without a transport. */
export function composeEnquiryAlert(e: Enquiry, addr: { to: string; from: string }) {
  const lines = [
    `New enquiry via ${SOURCE_LABEL[e.source]}.`,
    '',
    `Name:      ${e.name}`,
    `Phone:     ${e.phone}`,
    `Email:     ${e.email ?? '—'}`,
    `Service:   ${e.serviceLabel}`,
    `Budget:    ${e.budgetLabel ?? '—'}`,
    `Received:  ${e.submittedAt.toISOString()}`,
    `Reference: ${e.referenceCode}`,
    '',
    'Message:',
    e.message?.trim() || '(none)',
  ]
  return {
    to: addr.to,
    from: addr.from,
    replyTo: e.email ?? undefined,
    subject: `New enquiry — ${e.name} · ${e.serviceLabel}`,
    text: lines.join('\n'),
  }
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly log = new Logger(MailService.name)
  private transport: Transporter | null = null
  private to = ''
  private from = ''

  constructor(private readonly config: ConfigService<Env, true>) {}

  onModuleInit() {
    const host = this.config.get('SMTP_HOST')
    const to = this.config.get('ALERT_TO')
    if (!host || !to) {
      this.log.warn('SMTP_HOST / ALERT_TO not set — enquiry alerts are disabled')
      return
    }
    const port = this.config.get('SMTP_PORT') ?? 587
    const user = this.config.get('SMTP_USER')
    this.transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass: this.config.get('SMTP_PASS') ?? '' } : undefined,
    })
    this.to = to
    this.from = this.config.get('ALERT_FROM') ?? to
  }

  get enabled() {
    return this.transport !== null
  }

  /** Three attempts with backoff; never throws — the caller records the outcome. */
  async sendEnquiryAlert(enquiry: Enquiry): Promise<AlertOutcome> {
    if (!this.transport) return 'skipped'
    const message = composeEnquiryAlert(enquiry, { to: this.to, from: this.from })
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      try {
        await this.transport.sendMail(message)
        return 'sent'
      } catch (err) {
        this.log.warn({ err, attempt, reference: enquiry.referenceCode }, 'enquiry alert failed')
        if (attempt < ATTEMPTS) await sleep(attempt * 2000)
      }
    }
    return 'failed'
  }
}
