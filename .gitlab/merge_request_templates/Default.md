<!--
Title this merge request the way you would title a commit:

    <type>(<scope>): <description>

This repository squash-merges, so the title becomes the commit subject. A prose
title passes review and then breaks the next push to the target branch.
-->

## What changed

## Why

## How it was checked

- [ ] `npm run lint` passes
- [ ] `npm run build` passes, and `dist/` holds every runtime path the module
      names
- [ ] Checked against a consuming site, if the rendering changed
- [ ] Nothing that resolves only on a private network reached a tracked file

<!--
No test or visual baseline items: this package has neither yet. They belong
here once the suites exist, not before.
-->
