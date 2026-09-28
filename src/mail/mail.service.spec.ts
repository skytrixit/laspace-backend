import type { Enquiry } from '../enquiries/enquiry.entity'
import { composeEnquiryAlert } from './mail.service'

const enquiry = {
  referenceCode: 'LAABCDEFGH',
  name: 'Ravi Teja',
  phone: '+91 98490 22314',
  email: 'ravi@example.test',
  serviceLabel: 'Full Home Interiors',
  budgetLabel: '₹12 – 25 Lakhs',
  message: '<b>Possession next month.</b>',
  source: 'website_form',
  submittedAt: new Date('2026-09-29T10:00:00.000Z'),
} as Enquiry

describe('composeEnquiryAlert', () => {
  const msg = composeEnquiryAlert(enquiry, { to: 'studio@example.test', from: 'site@example.test' })

  it('addresses the studio and lets a reply go straight to the visitor', () => {
    expect(msg.to).toBe('studio@example.test')
    expect(msg.replyTo).toBe('ravi@example.test')
    expect(msg.subject).toBe('New enquiry — Ravi Teja · Full Home Interiors')
  })

  it('is plain text with every field and the reference', () => {
    expect(msg.text).toContain('Reference: LAABCDEFGH')
    expect(msg.text).toContain('Phone:     +91 98490 22314')
    expect(msg.text).toContain('<b>Possession next month.</b>')
    expect(msg).not.toHaveProperty('html')
  })

  it('copes with the fields the modal does not collect', () => {
    const sparse = composeEnquiryAlert({ ...enquiry, email: null, budgetLabel: null, message: null }, { to: 'a@b.c', from: 'a@b.c' })
    expect(sparse.replyTo).toBeUndefined()
    expect(sparse.text).toContain('Email:     —')
    expect(sparse.text).toContain('(none)')
  })
})
