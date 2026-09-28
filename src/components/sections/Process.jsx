import Section from '../Section'
import { processSteps } from '../../data/site'

export default function Process() {
  return (
    <Section id="process" tone="offblack" labelledBy="process-title">
      <div className="container">
        <p className="eyebrow" style={{ marginBottom: 24 }}>
          — 04 / Our Process
        </p>
        <h2 className="h2--large process__title" id="process-title">
          From Blueprint to Belonging
        </h2>

        <ol className="process__grid">
          {processSteps.map((step) => (
            <li className="process__step" key={step.numeral}>
              <span className="process__badge" aria-hidden="true">
                {step.numeral}
              </span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}
