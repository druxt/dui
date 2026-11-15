# @druxt/dui

The DruxtJS interface, as a Nuxt 2 module.

One theme, one documentation shell and one set of components, so
[druxtjs.org](https://druxtjs.org) and a Druxt module's own documentation site
are the same site wearing different content.

## Status

Early. Extracted from druxtjs.org, proven against one module's documentation
site, and not yet published to npm. The components are lifted rather than
rewritten, so the look matches by construction and not by eye.

## What it provides

- **The theme.** A Tailwind preset carrying the palette, both daisyUI themes,
  the motion tokens and every prose rule, plus the stylesheets for the code
  blocks and the authored content.
- **The shell.** A `docs` layout: header, collapsible navigation, content
  column, table of contents, footer. The layout is part of the library, not
  something each site composes for itself.
- **The components.** Header, sidebar, table of contents, footer, colour mode
  toggle, code block, columns, rich text, the StackBlitz example panel and the
  icons they use, all auto-imported with a `Dui` prefix.
- **A markdown documentation site.** Point it at a repository and it stages the
  `README.md` as the landing page and `docs/*.md` as the pages, rewriting the
  links between them so the same files read correctly on GitHub and here.

## Use

```js
// nuxt.config.js
export default {
  buildModules: ['@nuxtjs/tailwindcss', '@nuxtjs/color-mode'],
  modules: [
    ['@druxt/dui', { repoUrl: 'https://github.com/owner/name', gitRef: 'main' }],
    '@nuxt/content',
  ],
}
```

```js
// tailwind.config.js
module.exports = { presets: [require('@druxt/dui/tailwind-preset')] }
```

List `@druxt/dui` before `@nuxt/content`. Content parses every file while it
initialises, so a hook registered by a module listed after it never runs.

The site needs a Vuex store, because the page hands the layout its navigation
and table of contents through one. Nuxt 2 only creates a store when a `store/`
directory exists, so an empty `store/index.js` is enough.

## Licence

MIT.
