import Section from '../Section'
import Shot from '../Shot'
import { aboutStory } from '../../data/content'

export default function Story() {
  return (
    <Section tone="black" labelledBy="story-0">
      <div className="container story__stack">
        {aboutStory.map((block, i) => (
          <div
            key={block.eyebrow}
            className={`story__block${block.flip ? ' story__block--flip' : ''}`}
          >
            <Shot
              src={block.image.src}
              alt={block.image.alt}
              radius={block.radius}
              width={block.width}
              height={block.height}
            />
            <div className="story__copy">
              <p className="eyebrow">{block.eyebrow}</p>
              <h2 id={`story-${i}`}>{block.title}</h2>
              <p>{block.body}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
