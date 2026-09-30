import { useEffect, useRef, useState } from 'react'
import { stats } from '../../data/content'
import { useReveal } from '../../hooks/useReveal'

const DURATION = 1600
const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3)

export default function Stats() {
  const revealRef = useReveal()
  const sectionRef = useRef(null)
  const [values, setValues] = useState(() => stats.map(() => 0))
  const started = useRef(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el || started.current) return undefined

    const finish = () => setValues(stats.map((s) => s.value))
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || !('IntersectionObserver' in window)) {
      started.current = true
      finish()
      return undefined
    }

    let frame
    const run = () => {
      const start = performance.now()
      const tick = (now) => {
        const p = Math.min((now - start) / DURATION, 1)
        const eased = easeOutCubic(p)
        setValues(stats.map((s) => Math.round(s.value * eased)))
        if (p < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true
            run()
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <section
      className="section section--black stats reveal"
      aria-label="Studio in numbers"
      ref={(node) => {
        sectionRef.current = node
        revealRef.current = node
      }}
    >
      <img
        className="stats__watermark"
        src="/brand/monogram.svg"
        alt=""
        aria-hidden="true"
        width="200"
        height="200"
      />
      <div className="container">
        <dl className="stats__grid">
          {stats.map((stat, i) => (
            <div key={stat.label}>
              <dt className="stat__value">
                {values[i]}
                <span className="stat__plus">+</span>
              </dt>
              <dd className="stat__label">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
