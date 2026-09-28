/**
 * Normalises the browser path for active-nav matching so `/about`,
 * `/about.html` and `/about/` all resolve to the same canonical `/about`.
 * The site is a multi-page build; clean URLs come from the host rewrite
 * (and, in dev and preview, from the cleanUrls plugin in vite.config.js).
 */
export function currentPath() {
  if (typeof window === 'undefined') return '/'
  let p = window.location.pathname.replace(/\.html$/, '').replace(/\/+$/, '')
  if (p === '' || p === '/index') return '/'
  return p
}
