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
| `llmsSections` | Further sections for `llms.txt`, each `{ title, links }`. See below.                                                  |

A section of `llmsSections` is a title and its links, and a link is
`{ text, href, notes }` with `notes` optional. This is for what a site knows
and a page cannot say: an index site listing the sites it points at, say.

```js
llmsSections: [
  {
    title: 'Modules',
    links: [
      {
        text: 'Druxt Canvas',
        href: 'https://contrib.druxtjs.org/druxt-canvas/',
        notes: 'Renders a Drupal Canvas page in Nuxt.',
      },
    ],
  },
]
```

### The card a link shows

Set `siteUrl` and the build also writes the metadata an unfurler reads: a
`description`, the Open Graph title, description, URL and image, and the one
Twitter tag that makes the image render wide. Each carries a `hid`, so a page
can override one.

The image is the repository's own social preview where it has one. GitHub
holds that picture and answers for it through its API, so the workflow that
builds the site makes the call and passes the address in `DOCS_OG_IMAGE`:

```yaml
- id: card
  continue-on-error: true
  env:
    GH_TOKEN: ${{ github.token }}
  run: |
    url=$(gh api graphql -f query='
      query($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          usesCustomOpenGraphImage
          openGraphImageUrl
        }
      }' -F owner=${{ github.repository_owner }}       -F name=${{ github.event.repository.name }}       --jq 'if .data.repository.usesCustomOpenGraphImage
            then .data.repository.openGraphImageUrl else "" end' || true)
    echo "DOCS_OG_IMAGE=$url" >> "$GITHUB_ENV"
```

`usesCustomOpenGraphImage` is the check. Where no card has been uploaded,
`openGraphImageUrl` still answers, with GitHub's own generated picture of a
repository, so the boolean is what says whether a real card exists. A
repository without one passes nothing and the site publishes the placeholder
card below instead.

| Option    | What it does                                                                       |
| --------- | ---------------------------------------------------------------------------------- |
| `ogImage` | An absolute URL for the card, which wins over `DOCS_OG_IMAGE` and the placeholder. |

The placeholder is published with this package and copied into the output,
not into `static/`, so it leaves nothing in the repository to ignore. It is
generic: it names the framework, since a card naming the module would mean
rendering text at build time.

`robots.txt` is written only when the site is served from `/`. A crawler reads
the one at a domain's root and no other, so a file published under a project
path would be read by nobody. That makes a root site the only place the sites
served beneath it can be announced, which is what `sitemaps` is for.

## Licence

MIT.
