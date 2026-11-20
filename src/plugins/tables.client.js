/**
 * The scroll region, column labels and stacked layout on every rendered table.
 *
 * The theme already styles `.docs-table`, its scroller, the right-edge fade
 * and the stacked layout it falls back to below 640px; nothing was creating
 * that markup. A markdown table reaches the content renderer as a bare
 * `table`, which no component owns, so the wrapper and the per-cell column
 * labels have to be added to the DOM after the fact.
 *
 * Without this a wide table matches `.prose table:not([data-enhanced])`, which
 * caps it at the content column. The browser then squeezes the columns rather
 * than letting the table scroll, and a reference table of four columns on a
 * phone becomes a word a line.
 *
 * An observer rather than a route hook: the content renders asynchronously and
 * more than once per route on a page that swaps a document in place.
 */
export default () => {
  if (typeof window === 'undefined') return

  const observers = []

  /*
   * The nearest heading above the table names its scroll region, because a
   * region with no name is announced as an unlabelled group. A Drupal-backed
   * page wraps each block, so the heading can sit inside an earlier sibling
   * rather than being one.
   */
  const label = (table, root) => {
    for (let node = table; node && node !== root; node = node.parentElement) {
      for (
        let prev = node.previousElementSibling;
        prev;
        prev = prev.previousElementSibling
      ) {
        if (/^H[1-6]$/.test(prev.tagName)) return prev.textContent.trim()
        const headings = prev.querySelectorAll('h1, h2, h3, h4, h5, h6')
        if (headings.length)
          return headings[headings.length - 1].textContent.trim()
      }
    }
    return document.title || 'Table'
  }

  const enhance = () => {
    document.querySelectorAll('.prose').forEach((root) => {
      root.querySelectorAll('table:not([data-enhanced])').forEach((table) => {
        table.setAttribute('data-enhanced', '')

        /*
         * Column headings become data-label on every body cell, which the
         * stacked layout prints above each value. Their scope is said out
         * loud too, for screen readers that ignore the thead and tbody split.
         */
        const headings = Array.from(table.querySelectorAll('thead th')).map(
          (th) => {
            th.setAttribute('scope', 'col')
            return th.textContent.trim()
          }
        )
        table
          .querySelectorAll('tbody th')
          .forEach((th) => th.setAttribute('scope', 'row'))
        table.querySelectorAll('tbody tr').forEach((row) => {
          Array.from(row.children).forEach((cell, i) => {
            if (headings[i]) cell.setAttribute('data-label', headings[i])
          })
        })

        const wrapper = document.createElement('div')
        wrapper.className = 'docs-table'
        // A table with no column headings has nothing to label a stacked
        // row with, so it keeps scrolling instead.
        if (headings.length) wrapper.setAttribute('data-stack', '')

        /*
         * An options table, four columns ending in a description, re-flows in
         * two tiers above the stacked layout, with the description on its own
         * line. Laying its rows out as blocks takes the table semantics away,
         * so the roles put them back for assistive technology.
         */
        if (headings.length === 4 && /^description$/i.test(headings[3])) {
          wrapper.setAttribute('data-tiers', '')
          table.setAttribute('role', 'table')
          table
            .querySelectorAll('thead, tbody')
            .forEach((group) => group.setAttribute('role', 'rowgroup'))
          table
            .querySelectorAll('tr')
            .forEach((row) => row.setAttribute('role', 'row'))
          table
            .querySelectorAll('thead th')
            .forEach((th) => th.setAttribute('role', 'columnheader'))
          table
            .querySelectorAll('tbody td')
            .forEach((td) => td.setAttribute('role', 'cell'))
        }

        const scroller = document.createElement('div')
        scroller.className = 'docs-table-scroll'
        scroller.setAttribute('role', 'region')
        scroller.setAttribute('aria-label', label(table, root))

        table.parentNode.insertBefore(wrapper, table)
        scroller.appendChild(table)
        wrapper.appendChild(scroller)

        // A scroll region is a tab stop only while it scrolls, and the fade
        // shows only while there is more of the table to the right.
        const update = () => {
          const overflow = scroller.scrollWidth > scroller.clientWidth + 1
          const atEnd =
            scroller.scrollLeft + scroller.clientWidth >=
            scroller.scrollWidth - 1
          wrapper.toggleAttribute('data-overflow', overflow && !atEnd)
          if (overflow) scroller.setAttribute('tabindex', '0')
          else scroller.removeAttribute('tabindex')
        }
        scroller.addEventListener('scroll', update, { passive: true })
        if (window.ResizeObserver) {
          const observer = new window.ResizeObserver(update)
          observer.observe(scroller)
          observer.observe(table)
          observers.push(observer)
        }
        update()
      })
    })
  }

  window.onNuxtReady(() => {
    enhance()

    // Coalesced: a single render produces many mutations, and enhancing is
    // idempotent but not free. Wrapping a table is itself a mutation, which
    // the guard above turns into a no-op on the pass it triggers.
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
