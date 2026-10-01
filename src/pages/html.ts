/* ── HTML helpers for server-injected pages ────────────────────────────── */

/** JSON that is safe inside a <script> element: no `</script>`, no HTML comment openers, no line separators. */
export const scriptJson = (value: unknown) =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')

export const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Inserts the data block, the JSON-LD graphs and any extra head tags just before </head>; fills any __TOKEN__ in the template. */
export function injectHead(template: string, data: unknown, graphs: unknown[], tokens: Record<string, string> = {}, extra: string[] = []) {
  const blocks = [
    `<script id="__DATA__" type="application/json">${scriptJson(data)}</script>`,
    ...graphs.map((g) => `<script type="application/ld+json">${scriptJson(g)}</script>`),
    ...extra,
  ].join('\n    ')
  let html = template.replace('</head>', `    ${blocks}\n  </head>`)
  for (const [token, value] of Object.entries(tokens)) html = html.split(`__${token}__`).join(escapeHtml(value))
  return html
}

/** A first sentence, for meta descriptions. */
export const summary = (text: string, max = 160) => {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 80))}…`
}

/**
 * The tracking tags: the Search Console verification meta and the GA4 snippet.
 * Nothing at all until the IDs are configured, so a page never carries a dead
 * script. gtag.js (≈150 KB) is fetched only after the window load event and
 * an idle moment — loaded at head time it cost the projects page 15 Lighthouse
 * points on mobile, competing with the card images for bandwidth. Events fired
 * before it arrives queue in dataLayer, so nothing is lost; only a visitor who
 * leaves before the page has loaded goes uncounted.
 */
export function trackingHead(opts: { ga4Id?: string; siteVerification?: string }): string[] {
  const parts: string[] = []
  if (opts.siteVerification) parts.push(`<meta name="google-site-verification" content="${escapeHtml(opts.siteVerification)}">`)
  if (opts.ga4Id) {
    parts.push(`<script>${trackingScript(opts.ga4Id)}</script>`)
  }
  return parts
}

/** The inline GA4 loader, exported so the Content-Security-Policy can allow exactly this text by hash. */
export function trackingScript(ga4Id: string): string {
  const id = escapeHtml(ga4Id)
  return (
    `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}');` +
    `(function(){var l=function(){var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=${id}';document.head.appendChild(s)};` +
    `if(document.readyState==='complete'){l()}else{window.addEventListener('load',function(){'requestIdleCallback'in window?requestIdleCallback(l,{timeout:2000}):setTimeout(l,1)})}})();`
  )
}

/** The error/holding page's stylesheet — inline, allowed by hash in the CSP. */
export const SHELL_CSS =
  "body{margin:0;min-height:100vh;display:grid;place-items:center;background:#000;color:#f2ede6;font:300 17px/1.7 Jost,Helvetica,Arial,sans-serif;text-align:center}h1{font:500 40px/1.1 'Cormorant Garamond',Garamond,serif;margin:0 0 12px}a{color:#c29d62;text-decoration:none;letter-spacing:.2em;text-transform:uppercase;font-size:12px}p{color:#c4ad93;margin:0 0 28px}"
