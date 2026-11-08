import Img from '../Img'
import { useReveal } from '../../hooks/useReveal'
import { ctaImage } from '../../data/content'

export default function FinalCta() {
  const ref = useReveal()

  return (
    <section className="final-cta reveal" ref={ref} aria-labelledby="final-cta-title">
      <Img className="final-cta__bg" src={ctaImage.src} alt="" aria-hidden="true" />
      <div className="final-cta__overlay" />
      <div className="final-cta__inner">
        <h2 id="final-cta-title">
          Let us compose a home you are <em className="em-italic">proud</em> to come back to.
        </h2>
        <a className="btn btn--primary" href="/contact">
          Book a Consultation
        </a>
      </div>
    </section>
  )
}
