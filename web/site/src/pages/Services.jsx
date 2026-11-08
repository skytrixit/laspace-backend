import { useEffect } from 'react'
import ServiceBlock from '../components/services/ServiceBlock'
import { useReveal } from '../hooks/useReveal'
import { servicesHero, serviceBlocks } from '../data/content'

/* The fixed header's height, from the design token (80px). */
const navHeight = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80

/* The section's position in the layout. Not getBoundingClientRect: a section
   waiting to reveal is translated 26px down, and the rect would carry that. */
const layoutTop = (el) => {
  let y = 0
  for (let n = el; n; n = n.offsetParent) y += n.offsetTop
  return y
}

/* /services#c2 lands with the section 24px below the fixed header, on load
   and whenever the hash changes — the header dropdown links here. */
function useHashScroll() {
  useEffect(() => {
    const go = () => {
      const id = window.location.hash.slice(1)
      const el = id && document.getElementById(id)
      if (!el) return
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: layoutTop(el) - navHeight() - 24, behavior: reduced ? 'auto' : 'smooth' })
    }
    // on load, once the web fonts are in so the heights above are final
    let cancelled = false
    const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()
    ready.then(() => {
      if (!cancelled) go()
    })
    window.addEventListener('hashchange', go)
    return () => {
      cancelled = true
      window.removeEventListener('hashchange', go)
    }
  }, [])
}

export default function Services() {
  const ctaRef = useReveal(0.08)
  useHashScroll()

  return (
    <>
      <section className="svc-hero">
        <div className="svc-hero__inner">
          <p className="eyebrow">{servicesHero.eyebrow}</p>
          <h1>
            Everything your <em className="em-italic">space</em> needs.
          </h1>
          <p className="svc-hero__lead">{servicesHero.lead}</p>
        </div>
      </section>

      <div className="svc-blocks">
        {serviceBlocks.map((service, i) => (
          <ServiceBlock key={service.id} service={service} index={i} />
        ))}
      </div>

      <section className="svc-cta reveal" ref={ctaRef} aria-labelledby="svc-cta-title">
        <div className="svc-cta__inner">
          <h2 id="svc-cta-title">Not sure where to begin? Begin with a conversation.</h2>
          <a className="btn btn--primary" href="/contact">
            Book a Consultation
          </a>
        </div>
      </section>
    </>
  )
}
