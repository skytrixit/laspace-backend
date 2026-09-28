import Img from './Img'

/**
 * The curved-silhouette image treatment shared by the About and Services
 * pages: an offset gold outline frame echoing the clip radius exactly.
 *
 * Geometry is passed as CSS custom properties so every shape reuses one rule.
 * With no `src`, the clip box holds the monogram as a placeholder.
 */
export default function Shot({
  src,
  alt = '',
  radius,
  width = '460px',
  height,
  frameInset = '-20px',
  frameOpacity = 0.3,
  loading = 'lazy',
  fetchPriority,
  className = '',
}) {
  const style = {
    '--shot-r': radius,
    '--shot-w': width,
    '--shot-h': height,
    '--shot-inset': frameInset,
    '--shot-frame': `rgba(194, 157, 98, ${frameOpacity})`,
  }

  return (
    <div className={`shot ${className}`} style={style}>
      <div className="shot__frame" aria-hidden="true" />
      {src ? (
        <div className="shot__clip">
          <Img src={src} alt={alt} loading={loading} fetchPriority={fetchPriority} />
        </div>
      ) : (
        <div className="shot__clip shot__clip--placeholder">
          <img
            src="/brand/monogram.svg"
            alt={alt}
            width="200"
            height="200"
            loading={loading}
            decoding="async"
          />
        </div>
      )}
    </div>
  )
}
