---
'@druxt/dui': minor
---

Enhance a rendered table with the scroll region, column labels and stacked
layout the theme already styles.

A markdown table reaches the content renderer as a bare `table` that no
component owns, so the wrapper and the per-cell column labels are added to the
DOM once the content has rendered. Until now a wide table matched
`.prose table:not([data-enhanced])`, which caps it at the content column: the
browser squeezed the columns rather than letting the table scroll, and a
four-column reference table on a phone printed a word a line.
