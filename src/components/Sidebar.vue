<template>
  <div :class="docs ? 'lg:border-r lg:border-base-300' : ''">
    <!-- Mobile backdrop, shown wherever the drawer is. -->
    <div
      v-if="open"
      class="fixed inset-0 z-40 bg-neutral/60"
      :class="docs ? 'lg:hidden' : 'xl:hidden'"
      @click="$emit('close')"
    />

    <aside
      class="bg-base-100 border-r border-base-300 w-[17rem] flex-shrink-0 overflow-y-auto fixed inset-y-0 left-0 z-50 h-full transition-transform duration-200 ease-out"
      :class="[
        // `invisible` when closed, not only translated off-screen: a
        // transform alone would leave the drawer's links in the tab order.
        open ? 'translate-x-0' : '-translate-x-full invisible',
        // max-h, never h: a fixed height equal to the grid row leaves the
        // sticky column no travel, so a page shorter than the viewport
        // drags the whole navigation off screen as the footer scrolls in.
        // The column rule moves to the wrapper, which does stretch.
        docs
          ? 'lg:sticky lg:top-16 lg:z-auto lg:h-auto lg:max-h-[calc(100vh-4rem)] lg:translate-x-0 lg:visible lg:border-r-0'
          : '',
      ]"
      :aria-label="label"
    >
      <div
        class="flex items-center justify-between h-16 px-4 border-b border-base-300"
        :class="docs ? 'lg:hidden' : 'xl:hidden'"
      >
        <span class="text-sm font-semibold">Menu</span>
        <button
          type="button"
          class="btn btn-ghost btn-square btn-sm"
          aria-label="Close menu"
          @click="$emit('close')"
        >
          <span aria-hidden="true" class="text-xl leading-none">&times;</span>
        </button>
      </div>

      <div class="p-4 space-y-6">
        <slot name="before" />

        <!--
          The navigation. A Drupal-backed site puts a block region in the slot;
          a markdown site passes `sections` it derived from its content tree.
        -->
        <slot>
          <!--
            One list, not one per section. A list per section put the
            sidebar's `space-y-6` between every group, so the single overview
            link sat 24px clear of the heading below it while the links
            inside a group were 2px apart. A titled group takes a small top
            margin instead, which keeps one rhythm down the whole column.
          -->
          <ul class="menu gap-0.5">
            <template v-for="(section, key) of sections">
              <!--
                A titled section collapses. A long documentation set is a
                wall of links otherwise, and the reader working through one
                part has no way to put the others away. An untitled section,
                such as the single overview link, has nothing to collapse and
                renders flat.
              -->
              <li
                v-if="section.title"
                :key="`title-${key}`"
                class="menu-title pb-1"
                :class="key ? 'mt-3' : ''"
              >
                <button
                  type="button"
                  class="w-full flex items-center justify-between gap-2 uppercase tracking-wider"
                  :aria-expanded="String(!isClosed(key))"
                  @click="toggle(key)"
                >
                  <span>{{ section.title }}</span>
                  <span
                    aria-hidden="true"
                    class="transition-transform duration-150 opacity-60"
                    :class="isClosed(key) ? '-rotate-90' : ''"
                    >&#9662;</span
                  >
                </button>
              </li>
              <template v-if="!section.title || !isClosed(key)">
                <li v-for="link of section.links" :key="link.to || link.href">
                  <!--
                    A section entry is either a page of this site or somewhere
                    else entirely. An entry that leaves carries `href` instead
                    of `to`, opens in its own tab, and says so with the same
                    mark used everywhere else a link leaves, so a reader can
                    tell before clicking rather than after.
                  -->
                  <a
                    v-if="link.href"
                    class="rounded-btn px-3 py-1.5 text-sm text-base-content/70 hover:text-base-content"
                    :href="link.href"
                    target="_blank"
                    rel="noopener"
                  >
                    <span class="flex-1">{{ link.text }}</span>
                    <DuiIconExternal
                      class="w-3.5 h-3.5 flex-shrink-0 opacity-60"
                      aria-hidden="true"
                    />
                    <span class="sr-only">(opens in a new tab)</span>
                  </a>
                  <NuxtLink
                    v-else
                    class="rounded-btn px-3 py-1.5 text-sm"
                    :class="
                      link.to === currentPath
                        ? 'text-primary-focus font-medium bg-base-200'
                        : 'text-base-content/70 hover:text-base-content'
                    "
                    :to="link.to"
                    >{{ link.text }}</NuxtLink
                  >
                </li>
              </template>
            </template>
          </ul>

          <!--
            The ecosystem links. The header hides its own copies below `md`,
            where there is no room for them, so the drawer is where they are
            reachable on a phone.
          -->
          <ul
            v-if="links.length"
            class="menu gap-0.5 md:hidden border-t border-base-300 pt-4"
          >
            <li v-for="link of links" :key="link.text">
              <a
                class="rounded-btn px-3 py-1.5 text-sm text-base-content/70 hover:text-base-content"
                :href="link.href"
                target="_blank"
                rel="noopener"
                >{{ link.text }}</a
              >
            </li>
          </ul>
        </slot>

        <slot name="after" />
      </div>

      <div
        v-if="note || repoUrl"
        class="p-4 mt-2 border-t border-base-300 text-xs text-base-content/70 flex items-center justify-between"
      >
        <span>{{ note }}</span>
        <a
          v-if="repoUrl"
          class="link link-hover"
          :href="repoUrl"
          target="_blank"
          rel="noopener"
          >GitHub</a
        >
      </div>
    </aside>
  </div>
</template>

<script>
/**
 * The navigation drawer: a sticky column beside the content from `lg`, and a
 * drawer below it.
 *
 * The active link is decided by `currentPath` rather than by reading the
 * router, so the component can be rendered in a story, in a test, or by a
 * site whose routing this library knows nothing about.
 */
export default {
  data: () => ({ closed: {} }),

  methods: {
    isClosed(key) {
      return Boolean(this.closed[key])
    },
    toggle(key) {
      // $set, because a key added to a plain object after creation is not
      // reactive in Vue 2 and the section would collapse without redrawing.
      this.$set(this.closed, key, !this.closed[key])
    },
  },

  props: {
    /** Ecosystem links, as `{ text, href }`, shown where the header hides its own. */
    links: { type: Array, default: () => [] },
    open: { type: Boolean, default: false },
    /** false on full-bleed pages: drawer only, never sticky beside content. */
    docs: { type: Boolean, default: true },
    /** `[{ title, links: [{ text, to }] }]`, when the default navigation is used. */
    sections: { type: Array, default: () => [] },
    /** The path to mark as current. */
    currentPath: { type: String, default: null },
    label: { type: String, default: 'Documentation navigation' },
    /** A line at the foot of the drawer, e.g. the module's name. */
    note: { type: String, default: null },
    repoUrl: { type: String, default: null },
  },
}
</script>
