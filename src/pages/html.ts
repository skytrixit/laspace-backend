/* ── HTML helpers for server-injected pages ────────────────────────────── */

/** JSON that is safe inside a <script> element: no `</script>`, no HTML comment openers, no line separators. */
export const scriptJson = (value: unknown) =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')

export const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Inserts the data block and the JSON-LD graphs just before </head>; fills any __TOKEN__ in the template. */
export function injectHead(template: string, data: unknown, graphs: unknown[], tokens: Record<string, string> = {}) {
  const blocks = [
    `<script id="__DATA__" type="application/json">${scriptJson(data)}</script>`,
    ...graphs.map((g) => `<script type="application/ld+json">${scriptJson(g)}</script>`),
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
