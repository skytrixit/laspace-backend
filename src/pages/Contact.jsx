import EnquiryForm from '../components/contact/EnquiryForm'
import { site, contact } from '../data/site'

export default function Contact() {
  const rows = [
    { label: 'Phone', value: site.phone, href: site.phoneHref },
    { label: 'Email', value: site.email, href: site.emailHref },
    { label: 'WhatsApp', value: 'Message the Studio →', href: site.whatsappHref, external: true },
    { label: 'Hours', value: contact.hours },
  ]

  return (
    <>
      <section className="ct-hero">
        <div className="ct-hero__grid">
          <div className="ct-details">
            <p className="eyebrow">— Contact</p>
            <h1>
              Let’s talk about your <em className="em-italic">space</em>.
            </h1>

            <ul className="ct-list">
              {rows.map((row) => (
                <li key={row.label}>
                  <span className="ct-list__label">{row.label}</span>
                  {row.href ? (
                    <a
                      className="ct-list__value"
                      href={row.href}
                      {...(row.external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                    >
                      {row.value}
                    </a>
                  ) : (
                    <span className="ct-list__value">{row.value}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="ct-form-col">
            <h2 className="eyebrow">Enquiry</h2>
            <EnquiryForm />
          </div>
        </div>
      </section>

      <section className="ct-map" aria-labelledby="ct-map-title">
        <div className="ct-map__grid" aria-hidden="true" />
        <div className="ct-map__vignette" aria-hidden="true" />
        <div className="ct-map__inner">
          <span className="ct-map__pin" aria-hidden="true" />
          <p className="ct-map__name" id="ct-map-title">
            La Space Interiors — Visakhapatnam
          </p>
          <a
            className="ct-map__link"
            href={contact.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Google Maps →
          </a>
        </div>
      </section>
    </>
  )
}
