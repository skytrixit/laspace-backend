import { useReveal } from '../../hooks/useReveal'
import { partners } from '../../data/content'

export default function Partners() {
  const ref = useReveal()
  // Doubled list: the -50% keyframe against it gives a seamless loop.
  const doubled = [...partners, ...partners]

  return (
    <section className="section--black ribbon reveal" ref={ref} aria-label="Materials and hardware partners">
      <p className="ribbon__label">Materials &amp; Hardware We Trust</p>
      <ul className="ribbon__track">
        {doubled.map((brand, i) => {
          const inner = brand.logo ? (
            <img
              className="ribbon__logo"
              src={brand.logo.src}
              alt={brand.name}
              width={Math.round((brand.logo.width / brand.logo.height) * 28) || 96}
              height="28"
              loading="lazy"
              decoding="async"
            />
          ) : (
            brand.name
          )
          return (
            <li className="ribbon__item" key={`${brand.name}-${i}`} aria-hidden={i >= partners.length}>
              {brand.href ? (
                <a href={brand.href} target="_blank" rel="noopener noreferrer" tabIndex={i >= partners.length ? -1 : 0}>
                  {inner}
                </a>
              ) : (
                inner
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
