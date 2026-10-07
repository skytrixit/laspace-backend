/**
 * The one-time consultation prompt.
 *
 * Timing is measured from the first page of the visit rather than from the
 * current one. This is a multi-page build, so every internal link is a full
 * reload; a per-page timer would restart on each click and a visitor who
 * browses steadily would never reach fifteen seconds.
 *
 * Whether it has been shown lives in localStorage — once per browser, for
 * good. The arrival stamp lives in sessionStorage, so a visitor who comes
 * back tomorrow is not already "15 seconds in".
 *
 * Both stores are wrapped: Safari's private mode and a blocked storage
 * context throw on access rather than returning null, and a marketing
 * prompt is not worth breaking a page over.
 */

const SHOWN = 'laspace.consult-prompt.shown'
const ARRIVED = 'laspace.consult-prompt.arrived'

/** Fifteen seconds into the visit. */
export const PROMPT_DELAY = 15000

/* Never fire in the same instant a page appears — on the second or third
   page of a visit the budget is already spent, and a dialog that arrives
   with the paint reads as a broken page rather than an invitation. */
const MIN_DELAY = 1500

const read = (store, key) => {
  try {
    return window[store].getItem(key)
  } catch {
    return null
  }
}

const write = (store, key, value) => {
  try {
    window[store].setItem(key, value)
  } catch {
    /* no storage: the prompt simply behaves as a per-page timer */
  }
}

export const hasPrompted = () => read('localStorage', SHOWN) === '1'

export const markPrompted = () => write('localStorage', SHOWN, '1')

/** When this visit started, stamped on the first page that asks. */
function arrivedAt() {
  const stored = Number(read('sessionStorage', ARRIVED))
  if (Number.isFinite(stored) && stored > 0) return stored
  const now = Date.now()
  write('sessionStorage', ARRIVED, String(now))
  return now
}

/** Milliseconds left to wait, or null when the prompt is already spent. */
export function delayRemaining() {
  if (hasPrompted()) return null
  return Math.max(MIN_DELAY, PROMPT_DELAY - (Date.now() - arrivedAt()))
}
