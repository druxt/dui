---
'@druxt/dui': minor
---

feat(#9): add the Diagram component and its mermaid plugin

The theme already has the `.docs-diagram` rules, so a fenced mermaid block
stayed the code block it was authored as and that part of the stylesheet
applied to nothing. A first line of `%% text` captions the figure and names it
for a screen reader, and consecutive fences inside `.docs-diagram-row` render
as a row of cards.
