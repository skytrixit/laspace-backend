/**
 * Conversion events for GA4. The tag itself is injected by the studio API
 * when GA4_MEASUREMENT_ID is set, so `gtag` may not exist here — every call
 * is guarded and the page never depends on it.
 */
export function track(name, params = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  try {
    window.gtag('event', name, params)
  } catch {
    /* analytics must never break the page */
  }
}
