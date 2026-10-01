import { createHash } from 'node:crypto'

/* ── Content-Security-Policy ───────────────────────────────────────────────
   One policy for the pages, the admin and the API. Scripts come only from
   this origin (plus Google's tag when GA4 is configured); the two inline
   blocks the server itself writes — the GA4 snippet and the error-page
   style — are allowed by hash, so 'unsafe-inline' never appears for scripts.
   Style attributes stay allowed: React writes the card shapes as custom
   properties on the element, which is CSS, not code.
   ------------------------------------------------------------------------ */

export type CspInput = {
  production: boolean
  /** Origin images and media are served from, when not this one. */
  cdnBaseUrl?: string
  ga4Id?: string
  /** Inline <script> bodies the server emits; allowed by hash. */
  inlineScripts?: string[]
  /** Inline <style> bodies the server or the builds emit; allowed by hash. */
  inlineStyles?: string[]
}

export const sha256 = (text: string) => `'sha256-${createHash('sha256').update(text).digest('base64')}'`

const originOf = (url?: string) => {
  if (!url) return undefined
  try {
    return new URL(url).origin
  } catch {
    return undefined
  }
}

/** The inner text of every <tag>…</tag> in an HTML document that has no src attribute and runs (scripts: no data type). */
export function inlineBlocks(html: string, tag: 'script' | 'style'): string[] {
  const re = new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)</${tag}>`, 'gi')
  const out: string[] = []
  for (const m of html.matchAll(re)) {
    const attrs = m[1]
    if (/\bsrc\s*=/i.test(attrs)) continue
    if (tag === 'script' && /\btype\s*=\s*["'](?!module|text\/javascript|application\/javascript)/i.test(attrs)) continue
    if (m[2].trim()) out.push(m[2])
  }
  return out
}

export function cspDirectives(input: CspInput): Record<string, string[]> {
  const self = "'self'"
  const cdn = originOf(input.cdnBaseUrl)
  const own = cdn ? [self, cdn] : [self]
  const ga = Boolean(input.ga4Id)
  const scriptHashes = (input.inlineScripts ?? []).map(sha256)
  const styleHashes = (input.inlineStyles ?? []).map(sha256)
  const directives: Record<string, string[]> = {
    'default-src': [self],
    'base-uri': [self],
    'object-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'form-action': [self],
    'script-src': [self, ...scriptHashes, ...(ga ? ['https://*.googletagmanager.com'] : [])],
    /* Browsers without the -elem/-attr split read style-src; the ones with it
       get strict stylesheets and inline attributes only. */
    'style-src': [self, 'https://fonts.googleapis.com', "'unsafe-inline'"],
    'style-src-elem': [self, 'https://fonts.googleapis.com', ...styleHashes],
    'style-src-attr': ["'unsafe-inline'"],
    'font-src': [self, 'https://fonts.gstatic.com'],
    'img-src': [...own, 'data:', 'blob:', ...(ga ? ['https://*.google-analytics.com', 'https://*.googletagmanager.com'] : [])],
    'media-src': own,
    'connect-src': [...own, ...(ga ? ['https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com'] : [])],
    'worker-src': [self, 'blob:'],
    'manifest-src': [self],
  }
  if (input.production) directives['upgrade-insecure-requests'] = []
  return directives
}
