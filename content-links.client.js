/**
 * Routes clicks on this site's own links inside rendered content.
 *
 * The links are plain anchors, because they come from markdown rather than
 * from a NuxtLink, so a click would otherwise reload the whole page. The
 * router's base is stripped before pushing: it is part of the href the
 * browser needs and not part of the path the router knows.
 */

/*
 * How long to keep looking for the anchor's target, and how often.
 *
 * A cross-page hash lands before the content it names exists. The page's
 * markdown is fetched and rendered after the route resolves, so the element
 * the hash points at is absent for the first frames and the router's own
 * scroll handling finds nothing to scroll to. That is the whole bug this
 * solves: a reader on Troubleshooting clicking "Options", which lives in the
 * README and so on the landing page, arrived at the top of a long page with
 * no sign that the link had meant to take them anywhere in particular.
 */
const SETTLE_MS = 1500
const FRAME_MS = 50

const scrollToHash = (hash) => {
  const id = decodeURIComponent(hash.slice(1))
  if (!id) return
  const deadline = Date.now() + SETTLE_MS

  const attempt = () => {
    // getElementById, not a selector: an id from a heading slug can contain
    // characters a CSS selector would have to escape.
    const target = document.getElementById(id)
    if (target) {
      // The heading's own scroll-margin-top clears the sticky header, and
      // `scroll-behavior: smooth` on the document makes this glide.
      target.scrollIntoView()
      return
    }
    if (Date.now() < deadline) setTimeout(attempt, FRAME_MS)
  }

  attempt()
}

export default ({ app }) => {
  const base = app.router.options.base || '/'

  window.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    const link = event.target.closest('a')
    if (!link || link.target || link.hasAttribute('download')) return

    const href = link.getAttribute('href')
    if (!href) return

    /*
     * A fragment-only link, handled everywhere on the page rather than only
     * inside rendered content.
     *
     * `router.base` makes Nuxt emit `<base href="/<repository>/">`, and the
     * HTML specification resolves a fragment-only href against the document's
     * base URL rather than against the current page. Every `#anchor` on a
     * project site therefore points at the front page: the contents list at
     * the top of a documentation page, every heading's self-link, the table
     * of contents in the margin and the skip link all silently navigate away
     * instead of scrolling. A site served from a domain root never sees it,
     * which is why it is not visible in the component this was lifted from.
     */
    if (href.startsWith('#')) {
      if (href === '#') return
      event.preventDefault()
      const { path, query } = app.router.currentRoute
      app.router.push({ path, query, hash: href }).catch(() => {})
      scrollToHash(href)
      return
    }

    if (!link.closest('.nuxt-content')) return
    if (!href.startsWith('/') || href.startsWith('//')) return
    if (base !== '/' && !href.startsWith(base)) return

    const path = base === '/' ? href : href.slice(base.length - 1)
    const hashAt = path.indexOf('#')
    const hash = hashAt === -1 ? '' : path.slice(hashAt)

    event.preventDefault()

    // Navigating to the page you are already on is a duplicate the router
    // rejects, and the hash still has to be honoured, so it is handled here
    // rather than left to fail.
    if (path.slice(0, hashAt === -1 ? path.length : hashAt) === app.router.currentRoute.path) {
      if (hash) scrollToHash(hash)
      return
    }

    app.router
      .push(path)
      .then(() => { if (hash) scrollToHash(hash) })
      .catch(() => {})
  })
}
