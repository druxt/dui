<template>
  <div class="not-prose my-8 border border-base-300 rounded-lg bg-base-200 overflow-hidden text-base-content">
    <div class="flex flex-wrap items-center gap-3 px-3.5 py-2.5">
      <span class="relative flex h-[7px] w-[7px]" aria-hidden="true">
        <span v-if="loaded" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
        <span class="relative inline-flex h-[7px] w-[7px] rounded-full" :class="loaded ? 'bg-success' : 'bg-base-300'" />
      </span>
      <span class="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-base-content/70">
        {{ loaded ? 'Running' : 'Live example' }}
      </span>
      <code class="text-[13px] text-primary-focus">{{ dir }}</code>
      <a class="sm:ml-auto text-sm link link-hover text-primary-focus" :href="url" target="_blank" rel="noopener">
        Open in a new tab
      </a>
    </div>

    <!--
      Click to load where the embed is one block among many, because booting a
      Nuxt server and a mock Drupal inside the browser is slow and heavy to
      start on a reader who only wanted to read, and a reader who never
      presses the button pays nothing.

      `auto` is for the page that exists to run the example. Following a link
      called "Live example" is the decision the button would otherwise ask
      for, so asking again is a click that only costs time. The button still
      renders until mount, so the page keeps working where scripts do not.
    -->
    <div v-if="!embeddable" class="border-t border-base-300 bg-base-100 px-3.5 py-6 text-center">
      <a class="btn btn-sm btn-outline" :href="url" target="_blank" rel="noopener">Open the example</a>
      <p class="mt-2 text-[11.5px] text-base-content/70">
        It runs on StackBlitz, in a tab of its own.
      </p>
    </div>

    <div v-else-if="!loaded" class="border-t border-base-300 bg-base-100 px-3.5 py-6 text-center">
      <button type="button" class="btn btn-sm btn-outline" @click="loaded = true">Run this example</button>
      <p class="mt-2 text-[11.5px] text-base-content/70">
        {{ note }}
      </p>
    </div>

    <iframe
      v-else
      :src="embedUrl"
      :title="title"
      class="w-full border-0 border-t border-base-300 bg-base-100 block"
      :style="{ height }"
      allow="cross-origin-isolated"
    />
  </div>
</template>

<script>
/**
 * A runnable copy of one of the repository's own examples, on StackBlitz.
 *
 * It points at a directory in the repository rather than at a project built
 * for the page, so a reader edits the files a user of the module would
 * actually write, and the example cannot drift away from the documentation
 * that describes it.
 */
export default {
  props: {
    /** `owner/name` of the repository holding the example. */
    repo: { type: String, required: true },
    /** The branch or tag to open. */
    gitRef: { type: String, default: 'main' },
    /** The example's directory within the repository. */
    dir: { type: String, required: true },
    /** The file to show in the editor when it opens. */
    file: { type: String, default: null },
    /**
     * Start the example as soon as the component mounts, for a page whose
     * only purpose is to run it. Off everywhere else.
     */
    auto: { type: Boolean, default: false },
    height: { type: String, default: '32rem' },
    title: { type: String, default: 'Runnable example' },
    note: {
      type: String,
      default: 'It installs and starts in your browser, with a mock Drupal backend. Give it a minute.',
    },
  },

  data: () => ({ loaded: false, embeddable: false }),

  /*
   * In mounted, not in data: the generated HTML is the same either way, so a
   * reader whose scripts never run still gets a link rather than an iframe
   * the page cannot fill.
   *
   * StackBlitz runs the example in a WebContainer, which needs
   * SharedArrayBuffer and so a cross-origin isolated page. Isolation comes
   * from COOP and COEP response headers on *this* page, not on StackBlitz's,
   * and a host that cannot set headers (GitHub Pages among them) can never
   * provide it. Embedding there renders a frame that only ever says "Unable
   * to run Embedded Project". `window.crossOriginIsolated` is the browser's
   * own answer to the question, so the component asks it rather than being
   * told, and offers the tab instead, which works everywhere.
   */
  mounted() {
    this.embeddable = typeof window !== 'undefined' && window.crossOriginIsolated === true
    if (this.auto && this.embeddable) this.loaded = true
  },

  computed: {
    url: ({ repo, gitRef, dir }) => `https://stackblitz.com/github/${repo}/tree/${gitRef}/${dir}`,

    embedUrl() {
      const parameters = new URLSearchParams({ embed: '1', view: 'preview', hideNavigation: '1' })
      if (this.file) parameters.set('file', this.file)
      return `${this.url}?${parameters.toString()}`
    },
  },
}
</script>
