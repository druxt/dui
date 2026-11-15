---
'@druxt/dui': patch
---

Scroll to a heading again when a link inside rendered content is clicked. Nuxt
2 gives the router a push that returns no promise, so the work queued after the
navigation threw instead of running, and a link to another page's heading left
the reader at the top of it.
