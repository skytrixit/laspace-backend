import { useCallback, useEffect, useRef, useState } from 'react'
import { site, contact, serviceOptions } from '../data/content'
import { submitEnquiry } from '../lib/api'
import { track } from '../lib/analytics'
import { lockScroll, unlockScroll } from '../lib/scrollLock'
import '../styles/fields.css'
import '../styles/consult.css'

const EMPTY = { name: '', phone: '', service: '', message: '', website: '' }
const CTA_TEXT = /book\s+(a\s+)?(private\s+)?consultation/i
const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

function validate(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Please tell us your name.'
  if (!/^[\d\s+()-]{8,}$/.test(values.phone.trim())) errors.phone = 'Enter a valid phone number.'
  if (!values.service) errors.service = 'Please choose a service.'
  return errors
}

/**
 * Mounted once in the shared Layout, so it exists on every page exactly once.
 *
 * Opening is delegated: one capture-phase listener on `document` matches any
 * CTA by its text, so new "Book a Consultation" buttons work without touching
 * a page template. Each CTA keeps its `href="/contact"`, which is what runs
 * when JavaScript is off.
 */
export default function ConsultationModal() {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const [reference, setReference] = useState(null)
  const openedAt = useRef(0)

  const panelRef = useRef(null)
  const firstFieldRef = useRef(null)
  const triggerRef = useRef(null)

  const close = useCallback(() => {
    setOpen((wasOpen) => {
      if (!wasOpen) return false
      unlockScroll()
      return false
    })
    // Hand focus back to whatever opened the dialog.
    const trigger = triggerRef.current
    triggerRef.current = null
    if (trigger && document.contains(trigger)) trigger.focus()
  }, [])

  // Delegated open. Capture phase so it runs before anything else can act.
  useEffect(() => {
    const onClick = (e) => {
      const el = e.target.closest?.('a, button')
      if (!el) return
      if (el.closest('[role="dialog"]')) return // never re-trigger from inside
      if (!CTA_TEXT.test(el.textContent || '')) return

      e.preventDefault()
      triggerRef.current = el
      // Lock in the same handler that opens — deferring this to an effect
      // loses the race and the page scrolls behind the dialog.
      lockScroll()
      setValues(EMPTY)
      setErrors({})
      setSent(false)
      setReference(null)
      openedAt.current = Date.now()
      setOpen(true)
      // The mobile menu, if it was the source, closes underneath.
      window.dispatchEvent(new CustomEvent('consultation:open'))
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  // Escape to close, Tab trapped inside the panel.
  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== 'Tab') return

      const nodes = panelRef.current?.querySelectorAll(FOCUSABLE)
      if (!nodes || nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, close])

  // Move focus to the first field once the panel is on screen.
  useEffect(() => {
    if (open) firstFieldRef.current?.focus()
  }, [open])

  // Release the lock if the page unmounts while the dialog is open.
  useEffect(
    () => () => {
      if (open) unlockScroll()
    },
    [open]
  )

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    // Same destination and same fallback as the Contact page form.
    if (contact.formEndpoint) {
      try {
        const { referenceCode } = await submitEnquiry(contact.formEndpoint, {
          ...values,
          source: 'consultation_modal',
          formTs: openedAt.current,
        })
        setReference(referenceCode)
        track('generate_lead', { source: 'consultation_modal', service: values.service })
      } catch {
        openMailFallback(values)
        track('enquiry_fallback', { source: 'consultation_modal', service: values.service })
      }
    } else {
      openMailFallback(values)
      track('enquiry_fallback', { source: 'consultation_modal', service: values.service })
    }
    setSent(true)
  }

  if (!open) return null

  return (
    <div className="consult">
      <div className="consult__scrim" onClick={close} aria-hidden="true" />

      <div
        className="consult__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Book a consultation"
        ref={panelRef}
      >
        <button type="button" className="consult__close" aria-label="Close" onClick={close}>
          ✕
        </button>

        <p className="consult__eyebrow">Private Consultation</p>
        <h2 className="consult__title">
          Tell us about your <em className="em-italic">space</em>.
        </h2>
        <p className="consult__intro">
          Share a few details and our design team will call you within one working day.
        </p>

        {sent ? (
          <div className="consult__done" role="status">
            <h3>Thank you.</h3>
            <p>
              Your enquiry is with our studio. We will be in touch shortly.
              {reference && (
                <>
                  {' '}
                  Your reference is <strong>{reference}</strong>.
                </>
              )}
            </p>
          </div>
        ) : (
          <form className="consult__form" onSubmit={handleSubmit} noValidate>
            <Field id="consult-name" label="Your name" error={errors.name}>
              <input
                id="consult-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your Name"
                ref={firstFieldRef}
                value={values.name}
                onChange={set('name')}
                aria-invalid={Boolean(errors.name)}
                aria-describedby="consult-name-error"
                required
              />
            </Field>

            <Field id="consult-phone" label="Phone number" error={errors.phone}>
              <input
                id="consult-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="Phone Number"
                value={values.phone}
                onChange={set('phone')}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby="consult-phone-error"
                required
              />
            </Field>

            <Field id="consult-service" label="Service required" error={errors.service}>
              {/* `required` is what makes :invalid match, which is what keeps
                  the empty option dimmed like the other placeholders. */}
              <select
                id="consult-service"
                name="service"
                value={values.service}
                onChange={set('service')}
                aria-invalid={Boolean(errors.service)}
                aria-describedby="consult-service-error"
                required
              >
                <option value="" disabled>
                  Service Required
                </option>
                {serviceOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="consult-message" label="Tell us about your space">
              <textarea
                id="consult-message"
                name="message"
                rows="3"
                placeholder="Tell us about your space"
                value={values.message}
                onChange={set('message')}
              />
            </Field>

            {/* Honeypot — out of the accessibility tree and the tab order. */}
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="consult-website">Leave this empty</label>
              <input
                id="consult-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={values.website}
                onChange={set('website')}
              />
            </div>

            <button type="submit" className="btn btn--primary consult__submit">
              Request My Consultation
            </button>

            <a className="consult__alt" href="/contact">
              Or visit the full contact page →
            </a>
          </form>
        )}
      </div>
    </div>
  )
}

/** Visually hidden label + out-of-flow message, so errors never shift layout. */
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
    `Service: ${v.service}`,
    '',
    v.message || '',
  ].join('\n')

  window.location.href = `${site.emailHref}?subject=${encodeURIComponent(
    `Consultation request — ${v.service}`
  )}&body=${encodeURIComponent(body)}`
}
