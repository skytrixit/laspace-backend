import { useState } from 'react'
import Section from '../Section'
import { testimonials } from '../../data/site'

export default function Testimonials() {
  const [index, setIndex] = useState(0)
  const total = testimonials.length
  const current = testimonials[index]

  const prev = () => setIndex((i) => (i - 1 + total) % total)
  const next = () => setIndex((i) => (i + 1) % total)

  return (
    <Section id="testimonials" tone="offblack" labelledBy="testimonials-title">
      <h2 className="sr-only" id="testimonials-title">
        What our clients say
      </h2>
      <div className="container container--quote quote">
        <p className="quote__mark" aria-hidden="true">
          “
        </p>
        <figure style={{ margin: 0 }} aria-live="polite">
          <blockquote className="quote__text" style={{ margin: 0 }}>
            {current.quote}
          </blockquote>
          <figcaption className="quote__author">
            {current.author} — {current.role}
          </figcaption>
        </figure>

        <div className="quote__nav">
          <button type="button" className="quote__btn" aria-label="Previous testimonial" onClick={prev}>
            ←
          </button>
          <button type="button" className="quote__btn" aria-label="Next testimonial" onClick={next}>
            →
          </button>
        </div>
      </div>
    </Section>
  )
}
