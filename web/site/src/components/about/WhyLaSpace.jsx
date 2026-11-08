import Section from '../Section'
import { whyLaSpace } from '../../data/content'

export default function WhyLaSpace() {
  return (
    <Section tone="black" labelledBy="why-title">
      <div className="container">
        <p className="eyebrow" style={{ marginBottom: 24 }}>
          — 04 / Why La Space
        </p>
        <h2 className="why__title" id="why-title">
          What You Can Count On
        </h2>

        {/* Five cells into an auto-fit grid leaves the last row short — intended. */}
        <ul className="why__grid">
          {whyLaSpace.map((item) => (
            <li className="why__cell" key={item.no}>
              <p className="why__no">{item.no}</p>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
