import Shot from '../Shot'
import { useReveal } from '../../hooks/useReveal'

/** One service: image on one side, copy and scope list on the other. */
export default function ServiceBlock({ service, index }) {
  // Services blocks are taller than the About ones, so they trigger earlier.
  const ref = useReveal(0.08)
  const flip = index % 2 === 1

  return (
    <section
      id={service.id}
      ref={ref}
      className={`svc-block reveal${flip ? ' svc-block--flip' : ''}`}
      aria-labelledby={`${service.id}-title`}
    >
      <div className="svc-block__grid">
        <Shot
          src={service.image.src}
          alt={service.image.alt}
          radius={service.radius}
          width="480px"
          height="clamp(340px, 76vw, 540px)"
          loading={index === 0 ? 'eager' : 'lazy'}
        />

        <div className="svc-block__copy">
          <p className="eyebrow">{service.eyebrow}</p>
          <h2 id={`${service.id}-title`}>{service.name}</h2>
          <p className="svc-block__desc">{service.description}</p>

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
