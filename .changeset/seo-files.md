---
'@druxt/dui': minor
---

Write the files crawlers and assistants read: `sitemap.xml`, `llms.txt` and
`llms-full.txt`, and `robots.txt` where the site is the root of its domain.

A documentation site had no sitemap and nothing an assistant could read in one
request, so a reader who asked about a module got whatever a crawl had reached.
Set `siteUrl` and a build writes all of them into the output.

`robots.txt` only appears at a domain root, because a crawler reads the one
there and no other. A root site can name the sitemaps of the sites served
beneath it, which is the only way those sitemaps are announced at all.
