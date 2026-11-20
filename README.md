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

- **The theme.** A Tailwind preset with the palette, both daisyUI themes,
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
- **The files crawlers and assistants read.** Give it `siteUrl` and a build
  writes `sitemap.xml`, `llms.txt` and `llms-full.txt`, and `robots.txt` where
  the site is the root of its domain.

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

The site needs a Vuex store, because a page passes the layout its navigation
and table of contents through one. Nuxt 2 only creates a store when a `store/`
directory exists, so an empty `store/index.js` is enough.

### Publishing for crawlers and assistants

Set `siteUrl` to where the site is served and a build writes `sitemap.xml`,
[`llms.txt`](https://llmstxt.org) and `llms-full.txt` into the output.

```js
;['@druxt/dui', { siteUrl: 'https://example.org', order: ['install', 'usage'] }]
```

`siteUrl` has no default on purpose. It could be guessed from the environment
a build runs in, but the guess is wrong as soon as a custom domain is set, and
a sitemap of addresses that redirect is worse than no sitemap.

| Option         | What it does                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| `siteUrl`      | The origin the site is served from. Nothing below is written without it.                                              |
| `order`        | The page slugs in reading order, so `llms.txt` reads the way the site does. Anything left out follows alphabetically. |
| `sitemaps`     | Further sitemap URLs to name in `robots.txt`.                                                                         |
| `llmsSections` | Further `{ title, links }` sections for `llms.txt`.                                                                   |

`robots.txt` is written only when the site is served from `/`. A crawler reads
the one at a domain's root and no other, so a file published under a project
path would be read by nobody. That makes a root site the only place the sites
served beneath it can be announced, which is what `sitemaps` is for.

## Licence

MIT.
