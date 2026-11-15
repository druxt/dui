/*
 * What the page tells the layout: the navigation and the table of contents.
 *
 * It is a Vuex module rather than a plain injected object, and that is the
 * whole point of it. A Nuxt 2 layout cannot reach the page's own data, so the
 * two need somewhere to meet, and under `nuxt generate` that somewhere has to
 * be state the generator serialises. Vuex state is written into the page's
 * payload; a side effect on an injected object is not, so the server renders
 * a full sidebar and hydration then replaces it with an empty one. The page
 * looks right until the JavaScript arrives.
 *
 * The components underneath still take their data as props. This is the seam
 * between page and layout, not a store they read from.
 */
export default ({ store, $config }) => {
  if (!store) {
    throw new Error(
      '@druxt/dui needs Vuex. Add a store/index.js to the site, even an empty one: ' +
        'Nuxt 2 only creates the store when that directory exists.'
    )
  }

  store.registerModule(
    'docs',
    {
      namespaced: false,
      state: () => ({ sections: [], toc: [], links: [] }),
      mutations: {
        setDocsNav(state, { sections, toc }) {
          state.sections = sections || []
          state.toc = toc || []
        },
        /*
         * The ecosystem links. Set once, from config on a site with no
         * backend or from the menu on a Drupal-backed one, so that the header
         * and footer never learn which kind of site they are drawing for.
         */
        setDocsLinks(state, links) {
          state.links = links || []
        },
      },
    },
    // On the client the server's state is already there, and re-registering
    // would throw it away: the same empty sidebar, by a different route.
    { preserveState: Boolean(store.state.docs) }
  )
  /*
   * The ecosystem links, seeded from config. A site with a Drupal backend
   * commits the same shape from its menu instead, which is why this is store
   * state rather than a prop read straight from config by the header.
   */
  if ($config && $config.docsLinks) store.commit('setDocsLinks', $config.docsLinks)
}
