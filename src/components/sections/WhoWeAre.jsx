import Section from '../Section'
import Img from '../Img'
import { whoWeAreImage } from '../../data/site'

export default function WhoWeAre() {
  return (
    <Section id="who-we-are" tone="black" labelledBy="who-we-are-title">
      <div className="container who__grid">
        <div>
          <p className="eyebrow who__eyebrow">— 01 / Who We Are</p>
          <h2 className="h2--statement" id="who-we-are-title">
            We believe a home is not decorated — it is{' '}
            <em className="em-italic">composed</em>, room by room, until every
            surface answers to the way you actually live.
          </h2>
          <p className="body-copy" style={{ marginTop: 32 }}>
            LA Space Interiors is a design and turnkey execution studio in
            Visakhapatnam. We take a residence from first measurement to final
            handover — drawings, 3D, materials, factory-finished modules and site
            supervision under one roof.
          </p>
          <a className="text-link who__link" href="/about">
            About Us →
          </a>
        </div>

        <figure className="arch" style={{ margin: 0 }}>
          <span className="arch__frame" aria-hidden="true" />
          <span className="arch__clip">
            <Img src={whoWeAreImage.src} alt={whoWeAreImage.alt} sizes="(min-width: 920px) 50vw, 100vw" />
          </span>
        </figure>
      </div>
    </Section>
  )
}
