/**
 * Where the browser sends API calls. Same-origin `/api` by default — in
 * production the studio API serves the site itself. VITE_API_BASE in .env
 * points it elsewhere (its own host, another port). Read with a guard because
 * vite.config.js imports site.js, and through it this file, in Node, where
 * import.meta.env does not exist.
 */
export const API_BASE = (import.meta.env?.VITE_API_BASE || '/api').replace(/\/+$/, '')

/** `apiUrl('enquiries')` → `/api/enquiries`, or wherever VITE_API_BASE points. */
export const apiUrl = (path) => `${API_BASE}/${String(path).replace(/^\/+/, '')}`

/**
 * The one call the public site makes: submitting an enquiry.
 *
 * Throws on anything but a 2xx — a network failure, a 429 from the rate
 * limit, a 5xx — so the caller can fall back to the pre-filled email and
 * the enquiry is never lost.
 */
export async function submitEnquiry(endpoint, payload) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Enquiry not accepted (${res.status})`)
  return res.json() // { referenceCode, receivedAt }
}
