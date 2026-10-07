import Shot from '../Shot'
import { useReveal } from '../../hooks/useReveal'

/** One service: image on one side, copy and scope list on the other. */
export default function ServiceBlock({ service, index }) {
  // Services blocks are taller than the About ones, so they trigger earlier.
  const ref = useReveal(0.08)
  const flip = index % 2 === 1

  return (
    <section
      id={`c${index}`}
      ref={ref}
      className={`svc-block reveal${flip ? ' svc-block--flip' : ''}`}
      aria-labelledby={`c${index}-title`}
    >
      <div className="svc-block__grid">
        <Shot
          src={service.image ? service.image.src : undefined}
          media={service.image ? service.image.media : undefined}
          alt={service.image ? service.image.alt : ''}
          radius={service.radius}
          width="400px"
          height="clamp(220px, 52vw, 400px)"
          loading={index === 0 ? 'eager' : 'lazy'}
        />

        <div className="svc-block__copy">
          <p className="eyebrow">{service.eyebrow}</p>
          <h2 id={`c${index}-title`}>{service.name}</h2>
          <p className="svc-block__desc">{service.description}</p>
          {service.body &&
            service.body
              .split(/\n{2,}/)
              .filter(Boolean)
              .map((para, i) => (
                <p className="svc-block__desc" key={i}>
                  {para}
                </p>
              ))}

          <ul className="svc-scope">
            {service.scope.map((item) => (
              <li key={item}>
                <span className="svc-scope__dash" aria-hidden="true">
                  —
                </span>
                <span className="svc-scope__item">{item}</span>
              </li>
            ))}
          </ul>

          <a className="text-link svc-block__link" href="/contact">
            Enquire About This →
          </a>
        </div>
      </div>
    </section>
  )
}
