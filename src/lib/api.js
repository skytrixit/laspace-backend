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
