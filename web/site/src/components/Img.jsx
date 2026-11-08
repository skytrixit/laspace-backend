import meta from '../data/imageMeta.json'

/**
 * Every photographic image on the site. Two sources, one contract:
 *
 *   <Img src="/images/hero-1.jpg" alt="…" sizes="100vw" />
 *     static photography — derivatives written by scripts/images.mjs,
 *     dimensions and placeholder colour from src/data/imageMeta.json
 *
 *   <Img media={view} sizes="(min-width: 920px) 33vw, 100vw" />
 *     an image from the studio API — derivatives listed in the view
 *
 * Emits AVIF and WebP sources plus a JPEG srcset across every width that
 * exists, so a phone fetches the 800px file and a desktop the 2400px one;
 * carries intrinsic width/height so nothing reflows; and paints the image's
 * dominant colour behind it while it loads.
 *
 * `sizes` must describe the real rendered width or the browser picks the
 * wrong file — every call site sets it to its column.
 */
export default function Img({
  src,
  media,
  alt,
  className,
  loading = 'lazy',
  fetchPriority,
  sizes = '100vw',
  ...rest
}) {
  const set = media ? fromMedia(media) : fromStatic(src)

  return (
    <picture>
      {set.sources.map((s) => (
        <source key={s.type} type={s.type} srcSet={s.srcSet} sizes={sizes} />
      ))}
      <img
        src={set.fallback}
        srcSet={set.jpegSet || undefined}
        sizes={set.jpegSet ? sizes : undefined}
        alt={alt ?? set.alt ?? ''}
        className={className}
        width={set.width}
        height={set.height}
        loading={loading}
        fetchpriority={fetchPriority}
        decoding="async"
        style={set.color ? { backgroundColor: set.color } : undefined}
        {...rest}
      />
    </picture>
  )
}

/** Static: `${base}.w${width}.${ext}` per width in the manifest; the plain webp pair if none were generated. */
function fromStatic(src) {
  const file = src.split('/').pop()
  const m = meta[file] || {}
  const base = src.replace(/\.jpe?g$/i, '')
  const widths = m.widths || []
  const list = (ext) => widths.map((w) => `${base}.w${w}.${ext} ${w}w`).join(', ')

  if (widths.length === 0) {
    return {
      width: m.w,
      height: m.h,
      color: m.color || null,
      fallback: src,
      jpegSet: '',
      sources: [{ type: 'image/webp', srcSet: src.replace(/\.jpe?g$/i, '.webp') }],
    }
  }
  return {
    width: m.w,
    height: m.h,
    color: m.color || null,
    fallback: `${base}.w${widths[widths.length - 1]}.jpg`,
    jpegSet: list('jpg'),
    sources: [
      { type: 'image/avif', srcSet: list('avif') },
      { type: 'image/webp', srcSet: list('webp') },
    ],
  }
}

/** From the API: derivatives already carry their URLs. Not yet processed → just the original. */
function fromMedia(view) {
  const by = (format) =>
    (view.derivatives || []).filter((d) => d.format === format).sort((a, b) => a.width - b.width)
  const list = (ds) => ds.map((d) => `${d.src} ${d.width}w`).join(', ')
  const jpeg = by('jpeg')
  return {
    width: view.width,
    height: view.height,
    color: view.lqipColor || null,
    alt: view.alt,
    fallback: view.src,
    jpegSet: list(jpeg),
    sources: ['avif', 'webp']
      .map((f) => ({ type: `image/${f}`, srcSet: list(by(f)) }))
      .filter((s) => s.srcSet),
  }
}
