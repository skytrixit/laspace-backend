import { useState } from 'react'
import Section from '../Section'
import { faqs } from '../../data/site'

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggle = (i) => setOpenIndex((current) => (current === i ? null : i))

  return (
    <Section id="faq" tone="black" labelledBy="faq-title">
      <div className="container container--narrow">
        <p className="eyebrow" style={{ marginBottom: 24 }}>
          — 05 / Questions
        </p>
        <h2 className="h2--large faq__title" id="faq-title">
          Before You Begin
        </h2>

        <div className="faq__list">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div className="faq__item" key={faq.q}>
                <h3 style={{ margin: 0 }}>
                  <button
                    type="button"
                    className="faq__trigger"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-trigger-${i}`}
                    onClick={() => toggle(i)}
                  >
                    <span className="faq__q">{faq.q}</span>
                    <span className="faq__icon" aria-hidden="true">
                      +
                    </span>
                  </button>
                </h3>
                <div
                  className={`faq__panel${isOpen ? ' is-open' : ''}`}
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${i}`}
                >
                  <p>{faq.a}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}
