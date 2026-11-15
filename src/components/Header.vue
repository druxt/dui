<template>
  <header class="w-full border-b border-base-300 bg-base-100/90 backdrop-blur">
    <div
      class="max-w-[110rem] mx-auto h-16 px-4 sm:px-6 flex items-center gap-3"
    >
      <!-- Hidden wherever the drawer is: documentation pages keep a sidebar from `lg`. -->
      <button
        type="button"
        class="btn btn-ghost btn-square btn-sm -ml-1"
        :class="docs ? 'lg:hidden' : 'xl:hidden'"
        aria-label="Open navigation menu"
        @click="$emit('open-nav')"
      >
        <DuiIconMenu class="w-5 h-5" />
      </button>

      <!--
        The branding, and the section nav beside it. A Drupal-backed site puts
        a block region in here; a site with no backend puts its own markup in.
        Either way this component never learns where the content came from.
      -->
      <slot name="brand">
        <component
          :is="homeTo ? 'NuxtLink' : 'span'"
          :to="homeTo"
          class="flex items-center gap-2 rounded-btn hover:opacity-80"
        >
          <!--
            A repository's own generated mark, where it has one. Every Druxt
            repository carries an icon.svg, and a module's documentation site
            wearing the framework's logo reads as the wrong site.
          -->
          <img
            v-if="icon"
            :src="icon"
            class="w-6 h-6"
            alt=""
            aria-hidden="true"
          />
          <DuiLogo v-else class="w-6" :title="title" />
          <span class="text-base font-semibold tracking-tight">{{
            title
          }}</span>
        </component>
      </slot>

      <slot name="nav" />

      <div class="flex-1" />

      <slot name="actions" />

      <div class="flex items-center gap-1 xl:pl-2 xl:border-l border-base-300">
        <!--
          The marks that are the same across the ecosystem. Hidden below `md`,
          where the drawer carries them instead, so the bar does not crowd out
          the title on a phone.
        -->
        <a
          v-for="link of links"
          :key="link.text"
          class="hidden md:inline-flex btn btn-ghost btn-square btn-sm"
          :href="link.href"
          target="_blank"
          rel="noopener"
          :aria-label="link.text"
          :title="link.text"
        >
          <component :is="iconFor(link)" class="w-5 h-5" />
        </a>

        <DuiColorModeToggle />
      </div>
    </div>
  </header>
</template>

<script>
/**
 * The site header: the drawer toggle, the branding, the ecosystem links and
 * the colour mode control.
 *
 * Everything the two kinds of site source differently is a slot rather than a
 * prop, because the difference is not the data but where it comes from. On
 * druxtjs.org the branding and the section nav are blocks in the consumer
 * theme's header region; on a module's documentation site they are static
 * markup. A prop would have forced one of them to pretend to be the other.
 */
export default {
  props: {
    /** The site's name, used for the default branding and the logo's accessible name. */
    title: { type: String, default: 'DruxtJS' },
    /** A URL for the site's own mark. Falls back to the Druxt logo. */
    icon: { type: String, default: null },
    /** Where the branding links, when it links anywhere. */
    homeTo: { type: String, default: null },
    /** True on documentation pages, which keep a sidebar from `lg` rather than `xl`. */
    docs: { type: Boolean, default: true },
    /** Ecosystem links, as `{ text, icon, href }`. */
    links: { type: Array, default: () => [] },
  },

  methods: {
    // GitHub and Discord have their own marks; anything else falls back.
    iconFor(link) {
      return 'dui-icon-' + (link.icon || 'external')
    },
  },
}
</script>
