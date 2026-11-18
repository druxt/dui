# Releasing

`@druxt/dui` is not published yet. Everything that publishes it is in place,
and it follows the model the rest of the ecosystem already uses. What is left
is the one-time setup below, which only an npm account can finish.

After the first version, nobody runs `npm publish` by hand.

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

- **`.github/workflows/release.yml`** runs all of it. A push to a release
  branch that changes a changeset packs a `dev` snapshot. While changesets are
  pending it keeps a "version packages" pull request open; merging that pull
  request is the release decision, and the push that follows publishes the
  version, tags it and writes a GitHub Release. Building and publishing are
  separate jobs: the first builds the package without any way to reach npm,
  and the second starts from the packed tarball alone.
- **`npm pack` builds first**, through `prepack`, so a tarball is never packed
  from a stale `dist/`, or from none at all.

## Rerunning a release

Rerun **all** jobs, not only the failed one. The `pack` job chooses the
dist-tag, so a rerun of the failed job reuses the tag that just failed. npm
declines to apply `latest` to a version a higher one has overtaken, which
happens when a newer major publishes while the release waits for its reviewer,
and only a full rerun lets `pack` read the registry again and take that major's
own tag.

A version counts as released once npm has it and its GitHub Release exists. A
run that stops between the two leaves the version on npm, and the rerun skips
the publish and writes the Release that is missing.

## One-time setup

Publishing uses npm trusted publishing, so there is no npm token to store or
rotate. Until the setup is complete the workflow stops after packing: the
tarball it would have published is attached to the run as an artifact, and
nothing reaches npm.

1. Publish the first version by hand, from a clean build: `npm publish
--access public`. A package that does not exist on npm yet cannot name a
   trusted publisher. This one also opens the `@druxt` scope, which no
   published Druxt package has used before, so whoever publishes has to be a
   member of it.
2. On the npm website, open the package, then **Settings**, then **Trusted
   publisher**. Choose GitHub Actions, and enter the organization, the
   repository and the workflow filename `release.yml`. Leave the environment
   empty, because the `dev` job publishes without one. Under **Allowed
   actions**, tick **Allow npm publish**: the workflow publishes directly, and
   a publisher limited to staged publishing refuses it.
3. Under the repository's **Settings**, then **Environments**, create the
   `release` environment and add yourself, or the people who cut releases, as
   required reviewers. Without a rule the environment still works, but nothing
   pauses before a stable publish.
4. Create a GitHub App with read and write access to **Contents** and **Pull
   requests**, and install it on the repository. Store its ID as the repository
   variable `RELEASE_APP_ID` and its private key as the secret
   `RELEASE_APP_PRIVATE_KEY`. GitHub doesn't run checks on a pull request
   opened with the workflow's own token, so a protected branch would never see
   them pass.
5. Set the repository variable `NPM_PUBLISH` to `true`.

## Still missing

There are no tests, so `scripts/release-check.mjs` is here without the test
that covers it elsewhere.
