/**
 * Bridges `$colorMode.value` to the `data-theme` attribute daisyUI reads: the
 * Nuxt 2 release of @nuxtjs/color-mode only toggles a CSS class.
 *
 * A site's inline head script sets the attribute before first paint; this
 * keeps it in sync after that, which is what makes the toggle do anything.
 */
export default ({ app }) => {
  window.onNuxtReady(() => {
    const apply = (value) => {
      document.documentElement.setAttribute('data-theme', value)
    }

    apply(app.$colorMode.value)
    app.$colorMode.$watch('value', apply)
  })
}
