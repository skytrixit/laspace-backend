import { site, nav, services, credit } from '../data/content'
import SocialIcon from './SocialIcon'
import { useIsMobile } from '../hooks/useMediaQuery'
import { track } from '../lib/analytics'
import '../styles/footer.css'

export default function Footer() {
  const isMobile = useIsMobile()
  const year = new Date().getFullYear()

  return (
    <>
      <footer className="footer">
        <div className="footer__inner">
          <p className="footer__wordmark">LA Space Interiors</p>
          <div className="footer__divider" />

          <div className="footer__cols">
            <div>
              <div className="footer__seal">
                <img src="/brand/monogram.png" alt="" width="512" height="512" />
              </div>
              <p className="footer__tagline">Spaces you will love to live in.</p>
            </div>

            <nav aria-labelledby="footer-explore">
              <h2 className="footer__heading" id="footer-explore">
                Explore
              </h2>
              <div className="footer__links">
                {nav.map((item) => (
                  <a key={item.href} href={item.href}>
                    {item.label}
                  </a>
                ))}
              </div>
            </nav>

            <nav aria-labelledby="footer-services">
              <h2 className="footer__heading" id="footer-services">
                Services
              </h2>
              <div className="footer__links">
                {services.map((s) => (
                  <a key={s.no} href={s.href}>
                    {s.name}
                  </a>
                ))}
              </div>
            </nav>

            <div>
              <h2 className="footer__heading" id="footer-contact">
                Contact
              </h2>
              <div className="footer__contact">
                <address>
                  {site.address.map((line) => (
                    <span key={line}>
                      {line}
                      <br />
                    </span>
                  ))}
                </address>
                <a href={site.phoneHref} onClick={() => track('contact_click', { channel: 'phone', placement: 'footer' })}>
                  {site.phone}
                </a>
                <a href={site.emailHref}>{site.email}</a>
                <a
                  href={site.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('contact_click', { channel: 'whatsapp', placement: 'footer' })}
                >
                  WhatsApp Us →
                </a>
                <div className="footer__social">
                  {site.social.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${site.name} on ${s.label} — opens in a new tab`}
                      onClick={() => track('social_click', { channel: s.label.toLowerCase() })}
                    >
                      <SocialIcon name={s.label} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="footer__legal-divider" />
          <div className="footer__legal">
            <span>
              © {year} {site.name}. All rights reserved.
            </span>
            <span>
              Designed &amp; built by{' '}
              <a
                href={credit.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${credit.name} on WhatsApp — opens in a new tab`}
              >
                {credit.name}
              </a>
            </span>
          </div>
        </div>
      </footer>

      {isMobile && (
        <div className="action-bar">
          <a
            className="action-bar__call"
            href={site.phoneHref}
            onClick={() => track('contact_click', { channel: 'phone', placement: 'action_bar' })}
          >
            Call
          </a>
          <a
            className="action-bar__whatsapp"
            href={site.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('contact_click', { channel: 'whatsapp', placement: 'action_bar' })}
          >
            WhatsApp
          </a>
        </div>
      )}
    </>
  )
}
