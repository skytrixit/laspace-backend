import { useMemo, useState } from 'react'
import Img from '../components/Img'
import { projectFilters, portfolioProjects } from '../data/site'

/* Shapes cycle by grid position (index mod 6), so the rhythm survives
   filtering rather than being pinned to a particular project. */
const SHAPES = [
  '280px 280px 0 0', // arch top
  '0 0 200px 200px', // inverted arch
  '200px', // capsule / oval
  '0 280px 0 280px', // diagonal curves
  '280px 0 280px 0', // mirrored diagonals
  '280px 280px 0 0', // arch top
]

/* Heights alternate by position to break the grid line. */
const HEIGHTS = ['clamp(300px, 62vw, 440px)', 'clamp(260px, 54vw, 380px)']

export default function Projects() {
  const [active, setActive] = useState('All')

  const visible = useMemo(
    () =>
      active === 'All'
        ? portfolioProjects
        : portfolioProjects.filter((p) => p.tags.includes(active)),
    [active]
  )

  return (
    <>
      <section className="pj-hero">
        <div className="pj-hero__inner">
          <p className="eyebrow">— Portfolio</p>
          <h1>
            Spaces we’ve brought to <em className="em-italic">life</em>.
          </h1>
        </div>
      </section>

      <section className="pj-work" aria-labelledby="pj-work-title">
        <h2 className="sr-only" id="pj-work-title">
          Our projects
        </h2>
        <div className="pj-work__inner">
          <div className="pj-filters" role="group" aria-label="Filter projects by category">
            {projectFilters.map((f) => (
              <button
                key={f}
                type="button"
                className="pj-filter"
                aria-pressed={active === f}
                onClick={() => setActive(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="pj-empty">No projects in this category yet.</p>
          ) : (
            <div className="pj-grid">
              {visible.map((project, i) => (
                <a
                  className="pj-card"
                  key={project.slug}
                  href={`/projects/${project.slug}`}
                  style={{
                    '--card-r': SHAPES[i % SHAPES.length],
                    '--card-h': HEIGHTS[i % HEIGHTS.length],
                  }}
                >
                  <div className="pj-card__media">
                    <Img
                      src={project.image}
                      sizes="(min-width: 1300px) 25vw, (min-width: 920px) 33vw, 100vw"
                      alt={`${project.name} — ${project.type} in ${project.location}`}
                      loading={i < 2 ? 'eager' : 'lazy'}
                    />
                    <div className="pj-card__overlay">
                      <span className="pj-card__cta">View Project →</span>
                    </div>
                  </div>
                  <h3 className="pj-card__name">{project.name}</h3>
                  <p className="pj-card__meta">
                    {project.location} • {project.type}
                  </p>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
