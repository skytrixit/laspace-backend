import Section from '../Section'
import Img from '../Img'
import { projects } from '../../data/content'

export default function Portfolio() {
  return (
    <Section id="portfolio" tone="black" labelledBy="portfolio-title">
      <div className="container">
        <div className="portfolio__head">
          <div>
            <p className="eyebrow">— 03 / Portfolio</p>
            <h2 className="h2--large" id="portfolio-title" style={{ marginTop: 22 }}>
              Signature Spaces
            </h2>
          </div>
          <a className="text-link" href="/projects">
            View All Projects →
          </a>
        </div>

        <ul className="portfolio__grid">
          {projects.map((project) => (
            <li key={project.href} className={`project project--${project.shape}`}>
              <a href={project.href}>
                <figure style={{ margin: 0 }}>
                  <span className="project__media">
                    <Img
                      src={project.src}
                      media={project.media}
                      alt={project.alt}
                      sizes="(min-width: 1300px) 33vw, (min-width: 920px) 50vw, 100vw"
                    />
                  </span>
                  <figcaption>
                    <h3 className="project__name">{project.name}</h3>
                    <p className="project__meta">{project.meta}</p>
                  </figcaption>
                </figure>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
