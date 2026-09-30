import Img from '../components/Img'
import { project } from '../data/content'

/**
 * One project. The API serves this template with the project in __DATA__;
 * without it (a standalone preview) the page explains itself.
 */
export default function Project() {
  if (!project) {
    return (
      <section className="prj-hero">
        <div className="prj-hero__inner">
          <p className="eyebrow">— Portfolio</p>
          <h1>Project</h1>
          <p className="prj-hero__meta">This page is served with a project by the studio API.</p>
          <a className="text-link" href="/projects">
            ← All Projects
          </a>
        </div>
      </section>
    )
  }

  const facts = [project.location, project.areaLabel, project.yearLabel].filter(Boolean)
  const story = (project.fullDescription || project.shortDescription || '').split(/\n{2,}/).filter(Boolean)
  const renders = project.gallery.filter((g) => !project.cover || g.id !== project.cover.id)

  return (
    <>
      <section className="prj-hero">
        <div className="prj-hero__inner">
          <a className="text-link prj-back" href="/projects">
            ← All Projects
          </a>
          <p className="eyebrow">— {project.typeLabel || project.categories.join(' · ')}</p>
          <h1>{project.title}</h1>
          {facts.length > 0 && <p className="prj-hero__meta">{facts.join(' • ')}</p>}
        </div>
        {project.cover && (
          <div className="prj-hero__cover">
            <Img media={project.cover} alt={project.cover.alt || project.title} sizes="100vw" loading="eager" fetchPriority="high" />
          </div>
        )}
      </section>

      {story.length > 0 && (
        <section className="prj-story" aria-label="About this project">
          {story.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          {project.categories.length > 0 && (
            <p className="prj-tags">{project.categories.map((c) => `#${c}`).join('  ')}</p>
          )}
        </section>
      )}

      {renders.length > 0 && (
        <section className="prj-gallery" aria-labelledby="prj-gallery-title">
          <h2 className="sr-only" id="prj-gallery-title">
            Renders and photographs
          </h2>
          <div className="prj-gallery__grid">
            {renders.map((image, i) => (
              <figure className="prj-gallery__item" key={image.id}>
                <Img
                  media={image}
                  alt={image.alt || `${project.title} — view ${i + 1}`}
                  sizes="(min-width: 920px) 50vw, 100vw"
                  loading={i < 2 ? 'eager' : 'lazy'}
                />
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="svc-cta" aria-labelledby="prj-cta-title">
        <div className="svc-cta__inner">
          <h2 id="prj-cta-title">Like this? Begin with a conversation.</h2>
          <a className="btn btn--primary" href="/contact">
            Book a Consultation
          </a>
        </div>
      </section>
    </>
  )
}
