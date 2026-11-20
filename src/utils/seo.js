/*
 * The files a documentation site publishes for crawlers and for assistants:
 * `sitemap.xml`, `llms.txt` and `llms-full.txt`, plus `robots.txt` where the
 * site is served from the root of a domain.
 *
 * Every function here is pure and takes the pages it describes, so what the
 * site publishes can be checked without running a build.
 *
 * A page is `{ slug, markdown }`. `index` is the landing page and has no
 * path of its own.
 */

/** The page's own first heading, which is the title the site renders. */
export const titleOf = (page) => {
  const match = page.markdown.match(/^#\s+(.+?)\s*$/m)
  return match ? match[1].replace(/`/g, '') : page.slug
}

/*
 * The first paragraph of prose, as the page's one-line description.
 *
 * Headings, blockquotes, images, badges, HTML blocks and list items are all
 * skipped: a README opens with a banner, a badge row and a pull quote before
 * it says anything, and any of those as a description would say nothing.
 */
export const summaryOf = (page) => {
  const body = page.markdown.replace(/^#\s+.+$/m, '')
  for (const block of body.split(/\n\s*\n/)) {
    const text = block.trim()
    if (!text) continue
    if (/^[#>\-*|<![]/.test(text)) continue
    if (/^```/.test(text)) continue
    return (
      text
        .replace(/\s+/g, ' ')
        // Links read as their text, since a description is not a place to
        // put a URL.
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/[*_`]/g, '')
        .trim()
    )
  }
  return ''
}

/*
 * Every HTML comment removed, and then removed again until the text stops
 * changing. One pass is not enough: `<!--` inside a comment leaves a second
 * opener behind when the comment around it goes, and a single pass would
 * print that opener into the output.
 */
const withoutComments = (markdown) => {
  let text = markdown
  let previous
  do {
    previous = text
    text = text.replace(/<!--[\s\S]*?-->\n?/g, '')
  } while (text !== previous)
  return text
}

/*
 * The page's text with the furniture taken out: HTML comments, which carry
 * notes to linters and to editors rather than to a reader, and a line that is
 * nothing but badges, which says only that some service rendered an image.
 *
 * Content images are left alone. Their alt text says something, and a reader
 * of this file is as entitled to it as a reader of the page.
 */
const plain = (markdown) =>
  withoutComments(markdown)
    .split('\n')
    .filter(
      (line) => !/^\s*(\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)\s*)+$/.test(line)
    )
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')

/**
 * A slug as a URL path segment.
 *
 * A slug is a documentation file's name without its extension, and a file
 * name may hold characters a URL reads as punctuation: `#` would start a
 * fragment, `?` a query, a space is not allowed in a URL at all. A slug of
 * the usual shape passes through untouched, since none of its characters are
 * encoded.
 */
export const pathSegment = (slug) => encodeURIComponent(slug)

/** Where a page is served, as an absolute URL. */
export const urlOf = (page, { origin, base }) =>
  `${origin.replace(/\/$/, '')}${base}${
    page.slug === 'index' ? '' : pathSegment(page.slug)
  }`

/** XML text content, with the five characters XML reserves escaped. */
const xml = (text) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

/**
 * `sitemap.xml` for the site's own pages.
 *
 * No priority and no changefreq: search engines have said for years that
 * they ignore both, and a number nobody reads is a number that goes stale.
 *
 * @param {Array} pages - The pages, in reading order.
 * @param {object} site - `origin`, `base` and an ISO `lastmod`.
 * @returns {string} The sitemap document.
 */
export const buildSitemap = (pages, site) =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages.map((page) =>
      [
        '  <url>',
        `    <loc>${xml(urlOf(page, site))}</loc>`,
        ...(site.lastmod
          ? [`    <lastmod>${xml(site.lastmod)}</lastmod>`]
          : []),
        '  </url>',
      ].join('\n')
    ),
    '</urlset>',
    '',
  ].join('\n')

/**
 * `llms.txt`, the plain-text index described at https://llmstxt.org.
 *
 * An H1, a blockquote summary, then a list of the pages with a note on each.
 * Unlike the sitemap, every URL here says what it covers.
 *
 * @param {Array} pages - The pages, in reading order.
 * @param {object} site - `name`, `summary`, `origin` and `base`.
 * @returns {string} The index document.
 */
export const buildLlmsTxt = (pages, site) => {
  const lines = [`# ${site.name}`, '']
  if (site.summary) lines.push(`> ${site.summary}`, '')

  const landing = pages.find((page) => page.slug === 'index')
  const rest = pages.filter((page) => page.slug !== 'index')

  if (landing) {
    lines.push('## Overview', '')
    lines.push(
      `- [${titleOf(landing)}](${urlOf(landing, site)}): ${summaryOf(landing)}`.trimEnd()
    )
    lines.push('')
  }

  if (rest.length) {
    lines.push('## Documentation', '')
    for (const page of rest) {
      const summary = summaryOf(page)
      lines.push(
        `- [${titleOf(page)}](${urlOf(page, site)})${summary ? `: ${summary}` : ''}`
      )
    }
    lines.push('')
  }

  /*
   * Sections the site adds itself, for what it knows and this file cannot
   * read off a page: an index site listing the sites it points at, say.
   */
  for (const section of site.sections || []) {
    if (!section.links || !section.links.length) continue
    lines.push(`## ${section.title}`, '')
    for (const link of section.links) {
      lines.push(
        `- [${link.text}](${link.href})${link.notes ? `: ${link.notes}` : ''}`
      )
    }
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * `llms-full.txt`, every page's text in one file.
 *
 * The markdown is published as written. An assistant reading this should see
 * what a reader sees, and rewriting it here would be a second copy to keep
 * true. Each page is preceded by the URL it is served at, so a quotation can
 * be traced back to a page.
 *
 * @param {Array} pages - The pages, in reading order.
 * @param {object} site - `name`, `summary`, `origin` and `base`.
 * @returns {string} The full-text document.
 */
export const buildLlmsFullTxt = (pages, site) => {
  const parts = [`# ${site.name}`, '']
  if (site.summary) parts.push(`> ${site.summary}`, '')

  for (const page of pages) {
    parts.push(
      '---',
      '',
      `Source: ${urlOf(page, site)}`,
      '',
      plain(page.markdown).trim(),
      ''
    )
  }

  return parts.join('\n')
}

/**
 * `robots.txt`.
 *
 * Only ever written for a site served from the root of a domain: a crawler
 * reads `/robots.txt` and nothing else, so a file published under a project
 * path is read by nobody and would only suggest otherwise.
 *
 * @param {object} site - `origin` and `base`.
 * @param {Array<string>} sitemaps - Further absolute sitemap URLs to list,
 *   which is how a root site points at the sites served beneath it.
 * @param {string} [existing] - A robots.txt the site published itself, which
 *   is kept and has the sitemaps added to it.
 * @returns {string} The robots document.
 */
export const buildRobots = (site, sitemaps = [], existing = '') => {
  const own = `${site.origin.replace(/\/$/, '')}${site.base}sitemap.xml`
  const all = [own, ...sitemaps.filter((url) => url && url !== own)]

  /*
   * A site that publishes its own robots.txt keeps it, and the sitemaps are
   * added to it. `Sitemap` is a field of the file rather than of a group, so
   * it reads the same wherever it sits, and a site's own `Disallow` rules
   * matter more than the shape of this file.
   */
  if (existing.trim()) {
    const kept = existing.replace(/\n+$/, '')
    const already = (url) =>
      new RegExp(
        `^\\s*sitemap\\s*:\\s*${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`,
        'im'
      ).test(kept)
    const missing = all.filter((url) => !already(url))
    if (!missing.length) return `${kept}\n`
    return [kept, '', ...missing.map((url) => `Sitemap: ${url}`), ''].join('\n')
  }

  return [
    'User-agent: *',
    'Allow: /',
    '',
    ...all.map((url) => `Sitemap: ${url}`),
    '',
  ].join('\n')
}
