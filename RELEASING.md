# Releasing

`@druxt/dui` is not published yet, and there is no release workflow here to
publish it. This page is the model it will follow, which is the one the rest
of the ecosystem already uses, and what is in place for it today.

Nobody runs `npm publish` by hand.

| Channel     | npm dist-tag | When it publishes                                   | What it is for                        |
| ----------- | ------------ | --------------------------------------------------- | ------------------------------------- |
| Development | `dev`        | A push to a release branch that changes a changeset | Trying unreleased work on a real site |
| Stable      | `latest`     | When the versioning pull request merges             | Everyone else                         |

A release branch is named for its major, such as `0.x`. `baseBranch` in
`.changeset/config.json` names the branch releases are cut from.

## In place now

- **Changesets.** `npm run changeset` records a change. Write the summary as a
  conventional commit subject: `.changeset/changelog.cjs` turns it into a
  changelog sentence in the project style, with the issue and commit linked.
  That file is shared across Druxt repositories and takes its link base from
  the `repository` field, so it doesn't need editing here.
- **`npm run release:version`** applies the pending changesets and refreshes
  the lock file.
- **`npm run release:check`** is the pre-publish gate. It refuses a
  dependency specifier that resolves only on the author's machine, a version
  at or below the published one, and a `files` entry that exists but holds
  nothing. That last one is not hypothetical: this package's allowlist has
  already omitted two runtime plugins, which installs cleanly and fails in a
  consumer's build.

## Not in place yet

The workflow that runs the above. It lives on the GitHub side in every other
Druxt repository, and this package has no GitHub mirror, so it arrives with
one. Until then nothing publishes, and `release:check` is run by hand.

There are also no tests, so `scripts/release-check.mjs` is here without the
test that covers it elsewhere.
