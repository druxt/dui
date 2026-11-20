---
'@druxt/dui': minor
---

Write the metadata an unfurler reads, so a link to a documentation site shows
a description and a card rather than a bare URL.

A page had two meta tags, a charset and a viewport. Set `siteUrl` and the
build writes a `description`, the Open Graph title, description, URL and
image, and the Twitter tag that renders the image wide.

The image is the repository's own social preview where one has been uploaded.
GitHub answers for it through its API, so the workflow that builds the site
makes that call and passes the address in `DOCS_OG_IMAGE`. A repository
without a card falls back to a placeholder published with this package, never
to GitHub's generated picture of a repository.
