import { useEffect, useState } from 'react'
import { nav } from '../data/content'
import { useIsMobile } from '../hooks/useMediaQuery'
import { lockScroll, unlockScroll } from '../lib/scrollLock'
import '../styles/navbar.css'

export default function Navbar({ currentPath = '/' }) {
  const isMobile = useIsMobile()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the panel when we cross back to desktop, and lock scroll while open.
  useEffect(() => {
    if (!isMobile) setOpen(false)
  }, [isMobile])

  // Reference-counted: the consultation modal can hold the same lock, and
  // closing this menu to open it must not release the page.
  useEffect(() => {
    if (!open) return undefined
    lockScroll()
    return unlockScroll
  }, [open])

  // Opening the consultation modal from the menu closes the menu underneath.
  useEffect(() => {
    const onConsult = () => setOpen(false)
    window.addEventListener('consultation:open', onConsult)
    return () => window.removeEventListener('consultation:open', onConsult)
  }, [])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const isActive = (href) => currentPath === href

  return (
    <>
      <header className={`nav${scrolled ? ' is-scrolled' : ''}`}>
        <div className="nav__inner">
          <a className="nav__logo" href="/" aria-label="LA Space Interiors — home">
            <img src="/brand/logo.svg" alt="LA Space Interiors" width="420" height="108" />
          </a>

          <nav className="nav__links" aria-label="Primary">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`nav__link${isActive(item.href) ? ' is-active' : ''}`}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.label}
              </a>
            ))}
            <a className="nav__cta nav__cta--desktop" href="/contact">
              Book a Consultation
            </a>
          </nav>

          <button
            type="button"
            className="nav__burger"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div id="mobile-menu" className={`nav__panel${open ? ' is-open' : ''}`} aria-hidden={!open}>
        <div className="nav__panel-top">
          <img src="/brand/monogram.svg" alt="" width="200" height="200" />
          <button
            type="button"
            className="nav__close"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav aria-label="Mobile">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`nav__panel-link${isActive(item.href) ? ' is-active' : ''}`}
              aria-current={isActive(item.href) ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a className="nav__panel-cta" href="/contact">
          Book a Consultation
        </a>
      </div>
    </>
  )
}
