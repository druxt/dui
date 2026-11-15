# Contributing

Thanks for helping. This package is the interface every Druxt documentation
site wears, so a change here changes how all of them look at once.

## Getting set up

```bash
npm install
```

That installs dependencies and enables the git hooks. If you skipped install
scripts, run `npm run hooks:install` by hand, or the hooks stay on disk doing
nothing.

The toolchain is pinned in `.mise.toml`. With [mise](https://mise.jdx.dev)
installed, `mise install` gives you the same Node the pipeline uses.

## Layout

| Path                                                                           | What it is                                                                 |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `src/index.js`                                                                 | The Nuxt module. Build-time only, bundled to `dist/`.                      |
| `src/tailwind-preset.js`                                                       | The theme, bundled to `dist/` and reached as `@druxt/dui/tailwind-preset`. |
| `src/components/`, `src/layouts/`, `src/plugins/`, `src/assets/`, `src/utils/` | What a consuming site renders. Copied into `dist/` by mkdist.              |

Each `exports` entry is a build target, and siroc takes its source from the
matching subpath under `src/`. The module resolves runtime paths against its
own directory, which is `src/` here and `dist/` in a consumer, and the two
mirror each other. The JavaScript paths name the built extension, because
mkdist emits ESM and a module always runs from `dist/`.

**Do not add an `exports` entry that points outside `dist/`.** The entry
names where siroc writes, so one aimed at a file in the repository
overwrites that file and one naming a directory fills it with build output.
Both happened while this package was being set up, and neither failed the
build. The `build` job checks every runtime path the module names was
emitted, for that reason.

## Before you push

```bash
npm run lint
npm run build
```

`npm run lint` covers ESLint, Prettier, markdownlint, cspell, the private-host
check, the attribution check and knip. Prose is separate and needs Vale:

```bash
npm run lint:prose:install   # once
npm run lint:prose
```

## Changes that reach npm

While iterating against a consuming site, `npm run build:watch` rebuilds on
any change under `src/`. It is `scripts/watch.mjs` rather than siroc's own
`--watch`, which starts a Rollup watcher over the bundle entrypoints only: the
folder exports go through mkdist once at startup, so an edit to a component,
layout, plugin or stylesheet left `dist/` holding the previous copy, and the
consuming site read that copy. One build runs at a time, because two builds
writing `dist/` at once can finish out of order and leave output from older
source behind.

`package.json` keeps the key order siroc writes, because siroc rewrites the
manifest after every build. Reordering it by hand means the next build undoes
the change, and the build job fails on the dirty tree rather than leaving the
reorder to reach the next commit unnoticed.

Add a changeset for anything a consuming site would notice:

```bash
npm run changeset
```

## Commits and merge requests

[Conventional Commits](https://www.conventionalcommits.org), and the same for
the merge request title. This repository squash-merges, so the title becomes
the commit subject and a prose one breaks the next push to the target branch.

CI checks the title with the same commitlint configuration as the commits, and
checks it as the subject it becomes rather than on its own. GitHub appends the
pull request number to a squashed subject, so a title inside the 100 character
header limit can still land outside it. To check a title before opening:

```bash
MERGE_REQUEST_TITLE="fix: a title to check" MERGE_REQUEST_NUMBER=12 \
  npm run lint:title
```

No commit, merge request description or tracked file credits an AI tool as
author, co-author or generator.
