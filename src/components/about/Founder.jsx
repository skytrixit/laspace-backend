import Section from '../Section'
import Shot from '../Shot'
import { founder } from '../../data/content'
import imageMeta from '../../data/imageMeta.json'

export default function Founder() {
  /* Only once the photograph has been processed; otherwise Shot falls back to
     the monogram rather than a broken image. */
  const portrait = imageMeta[founder.portrait?.split('/').pop()]
    ? founder.portrait
    : null

  return (
    <Section tone="offblack" labelledBy="founder-title">
      <div className="container">
        <div className="founder__grid">
          <div className="founder__card">
            <Shot
              src={portrait}
              alt={
                portrait
                  ? `${founder.name}, ${founder.role} of LA Space Interiors`
                  : ''
              }
              className="shot--circle"
              radius="50%"
              width="260px"
              height="260px"
              frameInset="-18px"
              frameOpacity={0.35}
            />
            <div className="founder__caption">
              <p className="founder__name">{founder.name}</p>
              <p className="founder__role">{founder.role}</p>
              <p className="founder__company">{founder.company}</p>
            </div>
          </div>

          <div className="founder__copy">
            <p className="eyebrow">{founder.eyebrow}</p>
            <h2 id="founder-title">{founder.quote}</h2>
            {founder.body.map((para) => (
              <p key={para.slice(0, 32)}>{para}</p>
            ))}
            <p className="founder__closing">{founder.closing}</p>
          </div>
        </div>
      </div>
    </Section>
  )
}
