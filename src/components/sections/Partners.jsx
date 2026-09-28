import { useReveal } from '../../hooks/useReveal'
import { partners } from '../../data/site'

export default function Partners() {
  const ref = useReveal()
  // Doubled list: the -50% keyframe against it gives a seamless loop.
  const doubled = [...partners, ...partners]

  return (
    <section className="section--black ribbon reveal" ref={ref} aria-label="Materials and hardware partners">
      <p className="ribbon__label">Materials &amp; Hardware We Trust</p>
      <ul className="ribbon__track">
        {doubled.map((brand, i) => (
          <li className="ribbon__item" key={`${brand}-${i}`} aria-hidden={i >= partners.length}>
            {brand}
          </li>
        ))}
      </ul>
    </section>
  )
}
