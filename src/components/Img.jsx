import meta from '../data/imageMeta.json'

/**
 * Every photographic image on the site.
 *
 * Emits a WebP source with the JPEG as fallback, and carries the intrinsic
 * width/height from src/data/imageMeta.json so the browser reserves the right
 * box before the file arrives — nothing reflows as images load.
 *
 * `picture { display: contents }` in base.css keeps the wrapper out of layout,
 * so every existing `.wrapper img` rule still applies unchanged.
 */
export default function Img({
  src,
  alt = '',
  className,
  loading = 'lazy',
  fetchPriority,
  ...rest
}) {
  const file = src.split('/').pop()
  const dims = meta[file]
  const webp = src.replace(/\.jpe?g$/i, '.webp')

  return (
    <picture>
      <source srcSet={webp} type="image/webp" />
      <img
        src={src}
        alt={alt}
        className={className}
        width={dims?.w}
        height={dims?.h}
        loading={loading}
        fetchpriority={fetchPriority}
        decoding="async"
        {...rest}
      />
    </picture>
  )
}
