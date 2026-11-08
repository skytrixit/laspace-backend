import Img from '../Img'
import { useReveal } from '../../hooks/useReveal'
import { aboutCta } from '../../data/content'

export default function AboutCta() {
  const ref = useReveal()

  return (
    <section className="about-cta reveal" ref={ref} aria-labelledby="about-cta-title">
      <Img className="about-cta__bg" src={aboutCta.image.src} alt="" aria-hidden="true" />
      <div className="about-cta__overlay" />
      <div className="about-cta__inner">
        <h2 id="about-cta-title">{aboutCta.title}</h2>
        <a className="btn btn--outline" href="/contact">
          Book a Consultation
        </a>
      </div>
    </section>
  )
}
