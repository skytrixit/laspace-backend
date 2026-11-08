import { useEffect, useRef, useState } from 'react'
import Img from '../Img'
import { heroSlides } from '../../data/content'
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'

const INTERVAL = 6000

/* Each word rises out of its own mask when the entry loader leaves. */
const HEADLINE = [
  { text: 'Spaces' },
  { text: 'you' },
  { text: 'will' },
  { text: 'love', em: true },
  { text: 'to' },
  { text: 'live' },
  { text: 'in.' },
]

export default function Hero() {
  const [index, setIndex] = useState(0)
  const reduced = usePrefersReducedMotion()
  const timer = useRef(null)

  // Depending on `index` as well as `reduced` is deliberate: choosing a pass
  // restarts the 6s dwell rather than inheriting the remainder of the old one.
  useEffect(() => {
    if (reduced) return undefined
    timer.current = window.setInterval(
      () => setIndex((i) => (i + 1) % heroSlides.length),
      INTERVAL
    )
    return () => window.clearInterval(timer.current)
  }, [reduced, index])

  return (
    <section className="hero" aria-label="Featured interiors">
      {heroSlides.map((slide, i) => (
        <Img
          key={slide.src}
          className={`hero__slide${i === index ? ' is-active' : ''}`}
          src={slide.src}
          alt={slide.alt}
          // The first frame is the LCP element — load it eagerly and early.
          loading={i === 0 ? 'eager' : 'lazy'}
          fetchPriority={i === 0 ? 'high' : 'low'}
        />
      ))}

      <div className="hero__scrim hero__scrim--v" />
      <div className="hero__scrim hero__scrim--h" />

      <div className="hero__content">
        <p className="hero__eyebrow">Bespoke Interiors — Visakhapatnam</p>
        <h1 className="hero__title">
          {HEADLINE.map((word, i) => (
            <span key={word.text}>
              <span className="hero__mask">
                {word.em ? (
                  <em className="em-italic hero__word" style={{ '--i': i }}>
                    {word.text}
                  </em>
                ) : (
                  <span className="hero__word" style={{ '--i': i }}>
                    {word.text}
                  </span>
                )}
              </span>
              {i < HEADLINE.length - 1 ? ' ' : ''}
            </span>
          ))}
        </h1>
        <p className="hero__sub">Full home interiors · Modular kitchens · Turnkey execution</p>

        <div className="hero__buttons">
          <a className="btn btn--primary" href="/contact">
            Book a Consultation
          </a>
          <a className="btn btn--secondary" href="/projects">
            View Our Work
          </a>
        </div>

        <div className="hero__passes" role="group" aria-label="Choose a hero image">
          {heroSlides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              className={`hero__pass${i === index ? ' is-active' : ''}`}
              aria-label={`Show image ${i + 1} of ${heroSlides.length}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>

      <div className="hero__cue" aria-hidden="true" />
    </section>
  )
}
