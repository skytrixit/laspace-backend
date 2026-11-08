import { useReveal } from '../hooks/useReveal'

/**
 * Every home-page band except the hero. Wraps the section in the one-shot
 * reveal and applies the alternating background + hairline bottom border.
 */
export default function Section({
  id,
  tone = 'black',
  className = '',
  labelledBy,
  children,
  threshold = 0.1,
  as: Tag = 'section',
}) {
  const ref = useReveal(threshold)

  return (
    <Tag
      id={id}
      ref={ref}
      aria-labelledby={labelledBy}
      className={`section section--${tone === 'offblack' ? 'offblack' : 'black'} reveal ${className}`}
    >
      {children}
    </Tag>
  )
}
