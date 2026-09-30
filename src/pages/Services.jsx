import ServiceBlock from '../components/services/ServiceBlock'
import { useReveal } from '../hooks/useReveal'
import { servicesHero, serviceBlocks } from '../data/content'

export default function Services() {
  const ctaRef = useReveal(0.08)

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
