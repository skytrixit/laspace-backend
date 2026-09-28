import Section from '../Section'
import { services } from '../../data/site'

export default function Services() {
  return (
    <Section id="services" tone="offblack" labelledBy="services-title">
      <div className="container">
        <p className="eyebrow" style={{ marginBottom: 24 }}>
          — 02 / Our Services
        </p>
        <h2 className="h2--large services__title" id="services-title">
          The Rooms We Craft
        </h2>

        <ul className="services__list">
          {services.map((service) => (
            <li key={service.no}>
              <a className="service-row" href={service.href}>
                <span className="service-row__no">{service.no}</span>
                <h3 className="service-row__name">{service.name}</h3>
                <span className="service-row__tag">{service.tag}</span>
                <span className="service-row__arrow" aria-hidden="true">
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
