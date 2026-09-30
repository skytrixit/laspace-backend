import { useRef, useState } from 'react'
import { site, contact, serviceOptions, budgetOptions } from '../../data/content'
import { submitEnquiry } from '../../lib/api'
import { track } from '../../lib/analytics'

const EMPTY = { name: '', phone: '', email: '', service: '', budget: '', message: '', website: '' }

function validate(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Please tell us your name.'
  if (!/^[\d\s+()-]{8,}$/.test(values.phone.trim()))
    errors.phone = 'Enter a valid phone number.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = 'Enter a valid email address.'
  if (!values.service) errors.service = 'Please choose a service.'
  return errors
}

/**
 * Posts to the studio API (`contact.formEndpoint`). If the API does not
 * accept the submission — offline, rate-limited, down — it falls back to
 * opening a pre-filled email, so an enquiry is never lost.
 *
 * `website` is a honeypot: hidden from people, filled by bots, and any value
 * in it makes the API discard the submission. `formTs` lets the API reject a
 * form submitted faster than a person could read it.
 */
export default function EnquiryForm() {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const [reference, setReference] = useState(null)
  const startedAt = useRef(Date.now())

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    if (contact.formEndpoint) {
      try {
        const { referenceCode } = await submitEnquiry(contact.formEndpoint, {
          ...values,
          source: 'website_form',
          formTs: startedAt.current,
        })
        setReference(referenceCode)
        track('generate_lead', { source: 'website_form', service: values.service })
      } catch {
        /* fall through to the mail client so the enquiry is never lost */
        openMailFallback(values)
        track('enquiry_fallback', { source: 'website_form', service: values.service })
      }
    } else {
      openMailFallback(values)
      track('enquiry_fallback', { source: 'website_form', service: values.service })
    }
    setSent(true)
  }

  if (sent) {
    return (
      <p className="ct-sent" role="status">
        <strong>Thank you — your enquiry is on its way.</strong>
        We reply to every enquiry within one working day. For anything urgent,
        call {site.phone} or message the studio on WhatsApp.
        {reference && (
          <>
            {' '}
            Your reference is <strong>{reference}</strong>.
          </>
        )}
      </p>
    )
  }

  return (
    <form className="ct-form" onSubmit={handleSubmit} noValidate>
      <div className="ct-pair">
        <Field id="name" label="Your name" error={errors.name}>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            value={values.name}
            onChange={set('name')}
            aria-invalid={Boolean(errors.name)}
            aria-describedby="name-error"
            required
          />
        </Field>

        <Field id="phone" label="Phone number" error={errors.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="Phone number"
            value={values.phone}
            onChange={set('phone')}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby="phone-error"
            required
          />
        </Field>
      </div>

      <Field id="email" label="Email address" error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Email address"
          value={values.email}
          onChange={set('email')}
          aria-invalid={Boolean(errors.email)}
          aria-describedby="email-error"
          required
        />
      </Field>

      <div className="ct-pair">
        <Field id="service" label="Service" error={errors.service}>
          <select
            id="service"
            name="service"
            value={values.service}
            onChange={set('service')}
            aria-invalid={Boolean(errors.service)}
            aria-describedby="service-error"
            required
          >
            <option value="" disabled>
              Service
            </option>
            {serviceOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field id="budget" label="Approximate budget">
          <select id="budget" name="budget" value={values.budget} onChange={set('budget')} required>
            <option value="" disabled>
              Approximate Budget
            </option>
            {budgetOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="message" label="Tell us about your space">
        <textarea
          id="message"
          name="message"
          rows="4"
          placeholder="Tell us about your space"
          value={values.message}
          onChange={set('message')}
        />
      </Field>

      {/* Honeypot — out of the accessibility tree and the tab order. */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="website">Leave this empty</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={set('website')}
        />
      </div>

      <button type="submit" className="btn btn--primary">
        Send Enquiry
      </button>
    </form>
  )
}

/** Visually hidden label + reserved space for the validation message. */
function Field({ id, label, error, children }) {
  return (
    <div className="ct-field">
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      {children}
      <span className="ct-error" id={`${id}-error`} role={error ? 'alert' : undefined}>
        {error || ''}
      </span>
    </div>
  )
}

function openMailFallback(v) {
  const body = [
    `Name: ${v.name}`,
    `Phone: ${v.phone}`,
    `Email: ${v.email}`,
    `Service: ${v.service}`,
    `Budget: ${v.budget || '—'}`,
    '',
    v.message || '',
  ].join('\n')

  window.location.href = `${site.emailHref}?subject=${encodeURIComponent(
    `Enquiry — ${v.service}`
  )}&body=${encodeURIComponent(body)}`
}
