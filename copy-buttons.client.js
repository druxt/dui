/*
 * By package path, not a relative one: addPlugin copies this file into the
 * build directory, where './utils/...' no longer points at this package.
 */
import { addCopyButton } from '@druxt/dui/utils/copy-button'

/**
 * The copy button on every rendered code block.
 *
 * The theme already styles `.docs-code .docs-copy`; nothing was creating the
 * markup. On a Drupal-backed site the code paragraph renders through a
 * component that draws its own button, but markdown goes to the content
 * renderer as a plain `pre`, which no component owns, so the button has to be
 * added to the DOM after the fact.
 *
 * An observer rather than a route hook: the content renders asynchronously
 * and more than once per route on a page that swaps a document in place.
 */
export default () => {
  if (typeof window === 'undefined') return

  const enhance = () => {
    document.querySelectorAll('.prose pre:not([data-enhanced])').forEach((pre) => addCopyButton(pre))
  }

  window.onNuxtReady(() => {
    enhance()

    // Coalesced: a single render produces many mutations, and enhancing is
    // idempotent but not free.
    let queued = false
    const observer = new MutationObserver(() => {
      if (queued) return
      queued = true
      window.requestAnimationFrame(() => {
        queued = false
        enhance()
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })
  })
}
