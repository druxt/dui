const { basename, dirname, join, resolve } = require('path')
const { pathToFileURL } = require('url')

/*
 * A dynamic import the bundler leaves alone. Written literally it is rewritten
 * to `require` when this module is bundled as CommonJS, and `require` cannot
 * load an ES module.
 */
const importModule = new Function('url', 'return import(url)')
const {
  copyFileSync,
  existsSync,
  mkdirSync,
  promises,
  readdirSync,
  readFileSync,
  writeFileSync,
} = require('fs')

/**
 * The DruxtJS documentation look, as a Nuxt 2 module.
 *
 * Adding it gives a site the theme, the components as `Dui*`, a `docs` layout
 * and a `docs` store module. A site's own job is then its content and the
 * handful of runtime values the layout names.
 */
/*
 * Runtime paths are resolved against this file's own directory, which is
 * dist/ in a consumer and src/ in this repository. The directories mirror
 * each other, so one path serves both.
 *
 * The JavaScript ones name the built extension. mkdist emits ESM, so a
 * plugin written as plugins/store.js is published as plugins/store.mjs, and
 * a module is always run from dist/. Vue and CSS files are copied unchanged
 * and keep their names. The extension never reaches a consumer's build:
 * addPlugin copies the file to the fileName given below it.
 */
module.exports = function dui(moduleOptions) {
  const options = { ...(this.options.druxtUiDocs || {}), ...moduleOptions }

  // The library ships .vue files, which Nuxt does not compile inside
  // node_modules unless it is told to.
  this.options.build.transpile = this.options.build.transpile || []
  this.options.build.transpile.push('@druxt/dui')

  /*
   * Auto-imported components are off by default in Nuxt 2, and the
   * components:dirs hook below is only read when they are on. Left to the
   * site, forgetting one line in nuxt.config.js renders every component in
   * this package as an unknown element: `<duiheader>` in the markup, no
   * header on the page, and no error anywhere to say why.
   */
  this.options.components =
    this.options.components === undefined ? true : this.options.components

  /*
   * Three groups of stylesheet, in this order: whatever other modules add,
   * then this theme, then the site's own.
   *
   * The order is the whole point, and getting it wrong is silent. Tailwind
   * and daisyUI both write `.prose pre`, as does this package's code.css,
   * all at the same specificity, so the last one in the bundle wins every
   * declaration they share. Registering the theme first put daisyUI after
   * it: `border-radius: var(--rounded-box)` with that variable undefined in
   * scope is invalid at computed-value time, so the radius fell back to the
   * initial 0 and every code block rendered square, on daisyUI's neutral
   * fill instead of the code surface. Nothing warns, and the block still
   * looks deliberately styled.
   *
   * `modules:done` is late enough that every other module has registered,
   * which is what makes the partition below honest.
   */
  const themeCss = ['app.css', 'code.css', 'docs.css'].map((file) =>
    join(__dirname, 'assets/css', file)
  )

  this.nuxt.hook('modules:done', () => {
    const current = (this.options.css || []).filter(
      (entry) => !themeCss.includes(entry)
    )
    /*
     * Anchored to Tailwind's own entry rather than to a snapshot of the
     * array. `buildModules` run before `modules`, so by the time this module
     * is set up @nuxtjs/tailwindcss has already registered its stylesheet and
     * a snapshot cannot tell it apart from one the site wrote.
     */
    const isTailwind = (entry) =>
      typeof entry === 'string' && /(^|[\\/])tailwind\.css$/.test(entry)
    const last = current.map(isTailwind).lastIndexOf(true)
    const at = last === -1 ? current.length : last + 1
    this.options.css = [
      ...current.slice(0, at),
      ...themeCss,
      ...current.slice(at),
    ]
  })

  /*
   * This package's code.css is the code theme, so @nuxt/content must not
   * inject its own as well. With both loaded the two fight and the tokens
   * come out washed to near-invisible against the block's background:
   * comments and punctuation disappear while the code still looks styled.
   */
  this.options.content = this.options.content || {}
  this.options.content.markdown = this.options.content.markdown || {}
  this.options.content.markdown.prism = {
    theme: false,
    ...(this.options.content.markdown.prism || {}),
  }

  /*
   * The pages this site renders, gathered where the content module can read
   * them.
   *
   * The repository's README is the landing page. It already carries the
   * banner, the badges, the features and the quick start, written for the
   * reader who arrives from npm or GitHub, and a hand-written landing page
   * beside it would be a second description of the module to keep in step
   * with the first. The documentation pages sit next to it.
   *
   * They are copied rather than read in place because the content module
   * takes a single directory, and the two sources are a file at the
   * repository root and a directory below it. Copying into one staging
   * directory is what lets both be pages of the same site without pointing
   * the content module at the repository root, where it would also find the
   * changelog, the contributing guide and every markdown file under
   * node_modules.
   *
   * Nothing is written into the repository: the staging directory belongs to
   * the site's build.
   */
  const repoRoot = resolve(options.repoRoot || join(this.options.srcDir, '..'))
  const docsDir = resolve(repoRoot, options.docsDir || 'docs')
  const readme = resolve(repoRoot, options.readme || 'README.md')
  const stageDir = join(this.options.srcDir, '.docs-content')

  /*
   * Where each staged page came from.
   *
   * A relative link has to be resolved against the file that wrote it, and
   * after staging every page sits in the same directory, so the staged path
   * can no longer answer that. The README's `docs/x.md` and a documentation
   * page's `./x.md` are the same target written from two different places.
   */
  const originBySlug = new Map()
  const slugByOrigin = new Map()

  /*
   * The staged pages, in the order they were staged, for the SEO files
   * written at the end of a build. The content module reads the same files,
   * but it is a runtime concern and nothing it holds is reachable from here
   * once generation has finished.
   *
   * Keyed by slug, because two sources can stage the same page: a repository
   * with both a README and `docs/index.md` writes `index.md` twice, and the
   * second write is the page the site serves. A list would describe the
   * first one as well, under the same address.
   */
  const staged = new Map()

  const stage = (source, slug) => {
    let text = readFileSync(source, 'utf8')
    /*
     * The README's own table of contents is navigation, and this site already
     * has a sidebar and a per-page contents list. Left in, the landing page
     * opens with a list of links to itself.
     */
    if (options.stripReadmeContents !== false && slug === 'index') {
      text = text.replace(/\n## Contents\n[\s\S]*?(?=\n## )/, '\n')
    }
    writeFileSync(join(stageDir, `${slug}.md`), text)
    originBySlug.set(slug, source)
    slugByOrigin.set(source, slug)
    staged.set(slug, { slug, markdown: text })
  }

  mkdirSync(stageDir, { recursive: true })
  if (existsSync(readme)) stage(readme, 'index')
  if (existsSync(docsDir)) {
    for (const file of readdirSync(docsDir)) {
      if (file.endsWith('.md'))
        stage(join(docsDir, file), basename(file, '.md'))
    }
  }

  this.options.content.dir = '.docs-content'

  /*
   * The module's own icon, as the site's mark and its favicon.
   *
   * Every Druxt repository carries a generated icon.svg at its root, so a
   * module documentation site should wear the module's mark rather than the
   * framework's. Copied into the static directory because the repository root
   * is outside anything Nuxt serves.
   */
  const icon = resolve(repoRoot, options.icon || 'icon.svg')
  if (existsSync(icon)) {
    const staticDir = resolve(
      this.options.srcDir,
      this.options.dir.static || 'static'
    )
    mkdirSync(staticDir, { recursive: true })
    copyFileSync(icon, join(staticDir, 'icon.svg'))

    const iconHref = `${(this.options.router || {}).base || '/'}icon.svg`
    this.options.publicRuntimeConfig = this.options.publicRuntimeConfig || {}
    this.options.publicRuntimeConfig.docsIcon = iconHref

    this.options.head = this.options.head || {}
    this.options.head.link = this.options.head.link || []
    this.options.head.link.push({
      rel: 'icon',
      type: 'image/svg+xml',
      href: iconHref,
    })
  }

  /*
   * The files a crawler and an assistant read: sitemap.xml, llms.txt,
   * llms-full.txt, and robots.txt where this site is the root of its domain.
   *
   * Written after generation, into the output directory, rather than into
   * static/. A file in static/ is copied into the repository's own tree on
   * every dev run, and these describe a published site rather than a
   * checkout.
   *
   * `siteUrl` is required and has no default. It could be guessed from
   * GITHUB_REPOSITORY, but a guess is wrong the moment a custom domain is
   * set, and a sitemap full of addresses that redirect is worse than no
   * sitemap at all.
   */
  if (options.siteUrl) {
    this.nuxt.hook('generate:done', async (generator) => {
      /*
       * Loaded here rather than required at the top of this file. The
       * builders are published as ESM beside the other runtime files, and
       * this module is published as a CommonJS bundle, which cannot require
       * one. The import is built at run time because the bundler rewrites a
       * literal `import()` in a CommonJS build back into `require`, which is
       * the call that cannot load it.
       */
      const { buildLlmsFullTxt, buildLlmsTxt, buildRobots, buildSitemap } =
        await importModule(pathToFileURL(join(__dirname, 'utils/seo.mjs')).href)

      const base = (this.options.router || {}).base || '/'
      const runtime = this.options.publicRuntimeConfig || {}
      const site = {
        origin: options.siteUrl,
        base,
        name: runtime.docsTitle || options.name || basename(repoRoot),
        summary: runtime.docsTagline || '',
        sections: options.llmsSections || [],
      }
      /*
       * No `lastmod`. The sitemap protocol asks for the date each page last
       * changed, and the only date a build knows is its own: a rebuild of
       * untouched documentation would report every page as modified, which
       * is the one thing the field is read for. The builder omits it.
       */

      /*
       * Reading order, so llms.txt reads the way the site does. The site
       * already declares it for the sidebar; anything left out follows, so
       * adding a page cannot drop it from the index.
       */
      const order = options.order || []
      const rank = (page) => {
        if (page.slug === 'index') return -1
        const at = order.indexOf(page.slug)
        return at === -1 ? order.length : at
      }
      const pages = [...staged.values()].sort(
        (a, b) => rank(a) - rank(b) || a.slug.localeCompare(b.slug)
      )

      const dir = generator.options.generate.dir
      const write = (name, contents) =>
        promises.writeFile(join(dir, name), contents)

      await write('sitemap.xml', buildSitemap(pages, site))
      await write('llms.txt', buildLlmsTxt(pages, site))
      await write('llms-full.txt', buildLlmsFullTxt(pages, site))
      if (base === '/') {
        /*
         * A site's own static/robots.txt has already been copied into the
         * output by now, so it is read back and kept: its rules are the
         * site's, and only the sitemaps are added to them.
         */
        const path = join(dir, 'robots.txt')
        const existing = existsSync(path)
          ? await promises.readFile(path, 'utf8')
          : ''
        await write(
          'robots.txt',
          buildRobots(site, options.sitemaps || [], existing)
        )
      }
    })

    /*
     * llmstxt.org discovery: the plain-text index that describes this page.
     */
    this.options.head = this.options.head || {}
    this.options.head.link = this.options.head.link || []
    this.options.head.link.push({
      hid: 'llms',
      rel: 'describedby',
      type: 'text/plain',
      href: `${(this.options.router || {}).base || '/'}llms.txt`,
    })
  }

  this.nuxt.hook('components:dirs', (dirs) => {
    dirs.push({ path: join(__dirname, 'components'), prefix: 'Dui' })
  })

  /*
   * The library's own markup has to be scanned for class names too. Without
   * this every utility used only inside this package is purged from the
   * stylesheet and the components render unstyled, which looks like a theme
   * that did not load rather than like a configuration mistake.
   */
  this.nuxt.hook('tailwindcss:config', (config) => {
    const paths = [
      join(__dirname, 'components/**/*.vue'),
      join(__dirname, 'layouts/**/*.vue'),
    ]
    if (Array.isArray(config.purge)) config.purge.push(...paths)
    else if (config.purge && Array.isArray(config.purge.content))
      config.purge.content.push(...paths)
    else if (Array.isArray(config.content)) config.content.push(...paths)
  })

  this.addLayout(
    { src: join(__dirname, 'layouts/docs.vue'), fileName: 'dui/docs.vue' },
    'docs'
  )

  /*
   * Cross-links between the authored pages.
   *
   * The pages are read on GitHub as well as here, so they link each other the
   * way GitHub needs: a relative path ending in .md. A route has no .md, so
   * every one of those links would 404 on the site while looking correct in
   * the repository. Rewriting them on the way in keeps one set of links
   * working in both places, and keeps the alternative - absolute site paths
   * in the markdown - from breaking the GitHub copy instead.
   */
  if (options.rewriteContentLinks !== false) {
    /*
     * The router's base has to be written into these links by hand.
     *
     * A NuxtLink gets the base added for it, but these are plain anchors in
     * markup the content renders, so nothing adds it for them. On GitHub
     * Pages, where the base is /<repository>/, a link written as /page sends
     * the reader to the domain root instead, and the site 404s on its own
     * cross-references while looking right in development, where the base is
     * exactly the "/" that hides the mistake.
     */
    const base = (this.options.router || {}).base || '/'

    this.nuxt.hook('content:file:beforeInsert', (document) => {
      if (!document || document.extension !== '.md' || !document.body) return
      /*
       * The page's own title.
       *
       * These files carry no front matter, because they are read on GitHub
       * too and a position/title block at the top of each one is noise there.
       * Nothing else sets a title, so the first level-one heading is it, and
       * without this every page's <title> is just the site's name.
       */
      if (!document.title) {
        walk(document.body, (node) => {
          if (!document.title && node.tag === 'h1')
            document.title = textOf(node)
        })
      }

      walk(document.body, (node) => {
        const href = node.props && node.props.href
        if (typeof href !== 'string') return
        // Anything absolute, external or a bare fragment is already right.
        if (/^([a-z]+:|\/|#)/i.test(href)) return
        const [path, fragment] = href.split('#')
        if (!path.endsWith('.md')) return

        const suffix = fragment ? `#${fragment}` : ''
        const origin = originBySlug.get(document.slug)
        if (!origin) return
        const target = resolve(dirname(origin), path)

        /*
         * A page of this site, but only if it really is one. Rewriting every
         * .md link would turn a link to a file that is not a page into a
         * route nothing serves: nuxt generate follows the links it finds, so
         * the build grows a page per broken guess, each rendering the 404
         * body under a 200. Checked against what was actually staged, not
         * against the shape of the path.
         */
        const slug = slugByOrigin.get(target)
        if (slug) {
          node.props.href = `${base}${
            slug === 'index' ? '' : encodeURIComponent(slug)
          }${suffix}`
          return
        }

        /*
         * A file of the repository rather than a page here. On GitHub the
         * link already works; on this site the same file is only reachable on
         * GitHub, so that is where it points.
         */
        if (
          options.repoUrl &&
          target.startsWith(repoRoot + require('path').sep)
        ) {
          const path2 = target.slice(repoRoot.length + 1)
          const ref = options.gitRef || 'HEAD'
          node.props.href = `${options.repoUrl.replace(/\/$/, '')}/blob/${ref}/${path2}${suffix}`
        }
      })
    })
  }

  this.addPlugin({
    src: join(__dirname, 'plugins/store.mjs'),
    fileName: 'dui/plugin.js',
    options,
  })

  // Clicks on those anchors, routed rather than reloaded.
  this.addPlugin({
    src: join(__dirname, 'plugins/content-links.client.mjs'),
    fileName: 'dui/content-links.client.js',
    mode: 'client',
  })

  // The copy button on rendered code blocks; the theme already styles it.
  /*
   * The helper the plugin below imports, copied in beside it.
   *
   * addPlugin copies a file into the build directory, where a relative import
   * out of the package no longer resolves, so the helper has to be there too.
   * A bare package specifier would work but would put a runtime path in the
   * package's public surface, which `exports` would then have to keep stable.
   */
  this.addTemplate({
    src: join(__dirname, 'utils/copy-button.mjs'),
    fileName: 'dui/copy-button.js',
  })

  this.addPlugin({
    src: join(__dirname, 'plugins/copy-buttons.client.mjs'),
    fileName: 'dui/copy-buttons.client.js',
    mode: 'client',
  })

  /*
   * The scroll region and stacked layout on rendered tables; the theme already
   * styles both. Without this a wide table is capped at the content column and
   * the browser squeezes its columns, so a reference table on a phone becomes
   * a word a line.
   */
  this.addPlugin({
    src: join(__dirname, 'plugins/tables.client.mjs'),
    fileName: 'dui/tables.client.js',
    mode: 'client',
  })

  /*
   * The colour mode control only does anything with this: the Nuxt 2 release
   * of @nuxtjs/color-mode toggles a class, and daisyUI reads a data-theme
   * attribute.
   */
  this.addPlugin({
    src: join(__dirname, 'plugins/color-mode-theme.client.mjs'),
    fileName: 'dui/color-mode-theme.client.js',
    mode: 'client',
  })
}

// '../package.json' from both locations: this file lives in src/ in the
// repository and in dist/ once built, and the manifest sits above both.
module.exports.meta = require('../package.json')

/** Every node of a rendered document's tree, depth first. */
function walk(node, visit) {
  if (!node || typeof node !== 'object') return
  visit(node)
  for (const child of node.children || []) walk(child, visit)
}

/** A node's text, with the heading anchor's own markup left out. */
function textOf(node) {
  if (!node || typeof node !== 'object') return ''
  if (node.type === 'text') return node.value || ''
  if (node.tag === 'a' && node.props && node.props['aria-hidden']) return ''
  return (node.children || []).map(textOf).join('')
}
