<template>
  <div
    class="min-h-screen flex flex-col bg-base-100 text-base-content font-sans antialiased"
  >
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:m-3 focus:px-4 focus:py-2 focus:rounded-btn focus:bg-primary focus:text-primary-content"
      >Skip to content</a
    >

    <DuiHeader
      class="sticky top-0 z-50"
      :title="title"
      :icon="icon"
      home-to="/"
      :links="links"
      @open-nav="sidebar = true"
    >
      <template #actions><slot name="header-actions" /></template>
    </DuiHeader>

    <!--
      Sidebar / content / on-this-page, as a grid rather than a flex row.
      The columns are fixed widths around one that takes the remainder, which
      a flex row cannot express without the content column refusing to shrink
      below its contents: wide code blocks and tables then push the page
      sideways instead of scrolling inside it.
    -->
    <div class="docs-grid flex-grow w-full max-w-[110rem] mx-auto">
      <DuiSidebar
        :open="sidebar"
        :sections="sections"
        :links="links"
        :current-path="$route.path"
        :note="title"
        :repo-url="repoUrl"
        @close="sidebar = false"
      />

      <main id="main" class="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <!--
          The cap is on this wrapper, not on the prose element. The theme's
          prose rules set max-width to none, and a max-w-* utility on the same
          element loses to it on source order, so the column silently runs to
          full width.
        -->
        <div class="mx-auto max-w-content">
          <article class="prose">
            <Nuxt />
          </article>
        </div>
      </main>

      <!--
        Its own column from `xl`, and not rendered at all below that. The
        earlier version ordered it above the content on narrow viewports,
        where it reads as a wall of links between the reader and the page they
        asked for, and fell to the bottom wherever the parent was not a flex
        row.
      -->
      <aside class="hidden xl:block py-12 pr-8">
        <DuiToc v-if="toc.length" :toc="toc" class="sticky top-24" />
      </aside>
    </div>

    <DuiSiteFooter
      :title="title"
      :icon="icon"
      home-to="/"
      :tagline="tagline"
      :badges="badges"
      :links="links"
    />
  </div>
</template>

<script>
/**
 * The documentation layout: header, navigation, content, table of contents,
 * footer.
 *
 * The page supplies the navigation and the table of contents through the
 * store, because a layout cannot read the page's own data in Nuxt 2 and the
 * static build only carries state the store holds. The components it draws
 * them with take them as props, so nothing below this file knows where they
 * came from.
 */
export default {
  data: () => ({ sidebar: false, restoreFocusTo: null }),

  computed: {
    title: ({ $config }) => $config.docsTitle,
    icon: ({ $config }) => $config.docsIcon || null,
    tagline: ({ $config }) => $config.docsTagline,
    repoUrl: ({ $config }) => $config.docsRepoUrl,
    badges: ({ $config }) => $config.docsBadges || [],
    sections: ({ $store }) => $store.state.docs.sections,
    toc: ({ $store }) => $store.state.docs.toc,
    /*
     * The links that are the same on every Druxt site, plus whatever this one
     * adds. They come from the store rather than from config because a site
     * with a Drupal backend fills the same state from its menu, and the
     * header must not know which kind of site it is drawing for.
     */
    links: ({ $store }) => $store.state.docs.links || [],
  },

  watch: {
    // Closing the drawer on navigation: following a link inside it would
    // otherwise leave it covering the page it just opened.
    '$route.path': function () {
      this.sidebar = false
    },
  },

  mounted() {
    this.onKey = (e) => {
      // The drawer is a modal overlay; Escape is the keyboard way out.
      if (e.key === 'Escape' && this.sidebar) this.sidebar = false
    }
    window.addEventListener('keydown', this.onKey)
  },

  beforeDestroy() {
    window.removeEventListener('keydown', this.onKey)
  },
}
</script>

<style scoped>
/* Plain CSS, because this Tailwind version does not convert the
   underscore-as-space in a multi-token arbitrary value such as
   grid-cols-[17rem_minmax(0,1fr)]. */
@media (min-width: 1024px) {
  .docs-grid {
    display: grid;
    grid-template-columns: 17rem minmax(0, 1fr);
    /* A page shorter than the viewport otherwise gives the sticky sidebar a
       containing block no taller than itself, and it scrolls away with the
       content instead of staying put. */
    min-height: calc(100vh - 4rem);
  }
}

@media (min-width: 1280px) {
  .docs-grid {
    grid-template-columns: 17rem minmax(0, 1fr) 15rem;
  }
}
</style>
