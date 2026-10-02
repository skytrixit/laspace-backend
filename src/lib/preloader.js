/**
 * The entry loader on the home page.
 *
 * The overlay itself is static markup in index.html, so it is on screen at
 * first paint, before any script runs. A tiny inline script in the head adds
 * `has-preloader` to <html> when the loader is going to show — on arrival
 * from outside the site and on every reload of the home page, never when
 * the visitor comes here from another page of the site. This module then
 * drives it: the counter runs 000 → 100 in irregular steps, pauses, slides
 * the overlay up and off, and takes it out of the layout. The hero starts
 * its own entrance the moment the slide begins (`is-entered` on <html>,
 * plus a `preloader:exit` event for anything else that cares).
 *
 * `preloader.enabled` in src/data/site.js switches it off entirely; the Vite
 * plugin in vite.config.js applies that to the HTML.
 */
import { lockScroll, unlockScroll } from './scrollLock'

const TICK_MS = 26 // one counter step
const PAUSE_MS = 400 // at 100, before the slide
const SLIDE_MS = 1100 // matches the CSS transition

/* 1, 2 or 3 at a time — weighted so a run lands around 1.5 s. */
const step = () => {
  const r = Math.random()
  return r < 0.4 ? 1 : r < 0.8 ? 2 : 3
}

export function runPreloader() {
  const html = document.documentElement
  const el = document.getElementById('preloader')
  if (!el || !html.classList.contains('has-preloader')) {
    // disabled, an in-site navigation, or no markup: straight to the page
    if (el) el.hidden = true
    return
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const count = el.querySelector('.preloader__count')
  let n = 0
  let finished = false

  lockScroll()

  const finish = () => {
    if (finished) return
    finished = true
    el.hidden = true // display: none — it can no longer block a click
    unlockScroll()
  }

  const leave = () => {
    html.classList.add('is-entered') // the hero rises while the overlay slides
    window.dispatchEvent(new CustomEvent('preloader:exit'))
    if (reduced) {
      finish()
      return
    }
    el.classList.add('is-leaving')
    el.addEventListener('transitionend', finish, { once: true })
    window.setTimeout(finish, SLIDE_MS + 250) // in case transitionend never fires
  }

  const tick = () => {
    n = Math.min(100, n + step())
    if (count) count.textContent = String(n).padStart(3, '0')
    if (n < 100) {
      window.setTimeout(tick, TICK_MS)
      return
    }
    window.setTimeout(leave, PAUSE_MS)
  }

  window.setTimeout(tick, TICK_MS)
}
