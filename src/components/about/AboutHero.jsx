import Shot from '../Shot'
import { aboutHero } from '../../data/content'

export default function AboutHero() {
  return (
    <section className="about-hero">
      <div className="about-hero__grid">
        <div className="about-hero__text">
          <p className="eyebrow">{aboutHero.eyebrow}</p>
          <h1>
            The people behind the <em className="em-italic">spaces</em>.
          </h1>
          <p className="about-hero__lead">{aboutHero.lead}</p>
        </div>

        <div className="about-hero__media">
          <Shot
            src={aboutHero.image.src}
            alt={aboutHero.image.alt}
            radius="400px 400px 0 0"
            width="440px"
            height="clamp(360px, 80vw, 580px)"
            frameInset="-22px"
            frameOpacity={0.35}
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  )
}
