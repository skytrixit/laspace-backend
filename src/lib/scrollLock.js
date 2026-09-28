/**
 * Reference-counted scroll lock.
 *
 * Two things can lock the page at once: the mobile menu and the consultation
 * modal. Opening the modal from the menu closes the menu, and a naive
 * `overflow = ''` on the menu's cleanup would release the modal's lock a tick
 * after it was taken. Counting holders means the page stays locked until the
 * last one lets go.
 */
let holders = 0

export function lockScroll() {
  holders += 1
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
}

export function unlockScroll() {
  holders = Math.max(0, holders - 1)
  if (holders === 0) {
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
  }
}
