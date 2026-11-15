# Agent instructions

`@druxt/dui`: the DruxtJS interface as a Nuxt 2 module. The theme, the
documentation shell and the components that [druxtjs.org](https://druxtjs.org)
and every Druxt module's documentation site are built from.

## Rules

- **This package is published.** Nothing that resolves only on a private
  network may reach a tracked file: no internal URLs, hostnames, repository
  names or issue links, in any file, comments and lock files included.
  `npm run lint:private` enforces the URL-shaped half and runs in the
  pipeline. It cannot catch an internal name written as prose.
- **Conventional Commits**, and the same for merge request titles. A squash
  merge makes the title the commit subject.
- **No AI tool is credited.** No co-author trailer naming an assistant, no
  generated-with footer, in commits, merge request descriptions or tracked
  files. The commit-msg hook rejects it locally and the pipeline checks the
  rest.
- **Everything a consumer installs is built from `src/`.** Each `exports` entry
  is a build target whose source siroc takes from the matching subpath under
  `src/`, so `./components/*` builds `src/components` into `dist/components`.
  The module resolves runtime paths against its own directory, which mirrors
  `src/` in the repository and `dist/` in a consumer.
- **Never point an `exports` entry outside `dist/`.** The entry names where
  siroc writes, so one aimed at a file in the repository overwrites that file
  and one naming a directory fills it with build output. The `build` job
  checks every runtime path the module names was emitted.
- **`files` names `dist` and nothing from the repository.** A runtime file
  left out of the build installs cleanly and fails only in a consumer's
  build, where nothing points back here. `build:pack` guards it.
- **A change is proven against a consuming site.** The look is lifted from
  druxtjs.org rather than rewritten, so a regression shows up as a measured
  difference from it in computed styles, element positions and counts.

## Layout

| Path                     | Purpose                                                                   |
| ------------------------ | ------------------------------------------------------------------------- |
| `src/index.js`           | The Nuxt module                                                           |
| `src/tailwind-preset.js` | The theme as a Tailwind preset                                            |
| `src/components/`        | Components, registered with a `Dui` prefix                                |
| `src/layouts/`           | The `docs` layout                                                         |
| `src/plugins/`           | Client plugins for content links, copy buttons and the colour mode bridge |
| `src/assets/css/`        | The shared stylesheets                                                    |
| `src/utils/`             | Helpers the components and plugins import                                 |
| `scripts/`               | The private-host lint and the install hook                                |

## Commands

```bash
npm install          # dependencies, and enables the git hooks
npm run build        # siroc, to dist/
npm run lint         # every linter except prose
npm run lint:prose   # Vale, after npm run lint:prose:install
```

## Not here yet

Tests, Storybook and a GitHub mirror are all still to come. Storybook is the
next piece: stories for several of these components already exist in the
druxtjs.org repository and should move here with them rather than being
written again.
