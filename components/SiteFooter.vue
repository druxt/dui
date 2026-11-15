<template>
  <!--
    The site-wide footer; DuiDocFooter is the per-document one. Colours come
    from theme tokens, so a palette change carries through here.
  -->
  <footer class="border-t border-base-300 bg-base-200 text-base-content mt-auto">
    <div class="max-w-[110rem] mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <component :is="homeTo ? 'NuxtLink' : 'span'" :to="homeTo" class="flex items-center gap-2 w-max rounded-btn hover:opacity-80">
          <img v-if="icon" :src="icon" class="w-6 h-6" alt="" aria-hidden="true">
          <DuiLogo v-else class="w-6" :title="title" />
          <span class="text-base font-semibold tracking-tight">{{ title }}</span>
        </component>
        <p v-if="tagline" class="mt-3 text-sm text-base-content/70 max-w-xs">{{ tagline }}</p>
        <p v-if="badges.length" class="mt-3 flex flex-wrap gap-2">
          <a
            v-for="badge of badges"
            :key="badge.text"
            class="badge badge-sm badge-outline min-h-[24px] hover:border-primary hover:text-primary-focus"
            :href="badge.href"
            :title="badge.title || badge.text"
            target="_blank"
            rel="noopener"
          >{{ badge.text }}</a>
        </p>
      </div>

      <!--
        The footer menu. A Drupal-backed site puts a block region in the slot;
        a site with no backend gets the columns below, which are the same on
        every Druxt site so that a reader who arrives at a module can find
        their way back to the framework, the community and the source.
      -->
      <slot>
        <div v-for="column of columns" :key="column.title">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-base-content/70">{{ column.title }}</h2>
          <ul class="mt-3 space-y-2">
            <li v-for="link of column.links" :key="link.text">
              <component
                :is="link.href ? 'a' : 'NuxtLink'"
                class="text-sm text-base-content/70 hover:text-base-content link link-hover"
                v-bind="link.href ? { href: link.href, target: '_blank', rel: 'noopener' } : { to: link.to }"
              >{{ link.text }}</component>
            </li>
          </ul>
        </div>
      </slot>
    </div>

    <div class="border-t border-base-300">
      <div class="max-w-[110rem] mx-auto px-4 sm:px-6 py-4 text-xs text-base-content/70 flex flex-wrap gap-x-4 gap-y-1">
        <slot name="legal"><span>{{ licence }}</span></slot>
      </div>
    </div>
  </footer>
</template>

<script>
/**
 * The site footer.
 *
 * The standard columns are a default rather than a fixed list: a site with a
 * Drupal backend replaces them wholesale with its footer block region, and
 * one without gets the ecosystem links every Druxt site shows.
 */
export default {
  props: {
    title: { type: String, default: 'DruxtJS' },
    icon: { type: String, default: null },
    homeTo: { type: String, default: null },
    tagline: { type: String, default: null },
    /** Small outline badges, as `{ text, href, title }`. */
    badges: { type: Array, default: () => [] },
    /** This site's own ecosystem links, as `{ text, href }`, merged into the Source column. */
    links: { type: Array, default: () => [] },
    licence: { type: String, default: 'Released under the MIT licence.' },
  },

  computed: {
    columns() {
      return [
        {
          title: 'Druxt',
          links: [
            { text: 'Documentation', href: 'https://druxtjs.org' },
            { text: 'Modules', href: 'https://druxtjs.org/modules' },
            { text: 'Tutorials', href: 'https://druxtjs.org/tutorials' },
            { text: 'How-to guides', href: 'https://druxtjs.org/how-to' },
          ],
        },
        {
          title: 'Community',
          links: [
            { text: 'Discord', href: 'https://discord.druxtjs.org' },
            { text: 'GitHub', href: 'https://github.com/druxt' },
            { text: 'Drupal.org', href: 'https://www.drupal.org/project/druxt' },
            ...this.links.filter((link) => !['GitHub', 'Discord'].includes(link.text)),
          ],
        },
      ]
    },
  },
}
</script>
