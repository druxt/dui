/**
 * Point git at the committed hooks directory.
 *
 * The hooks live in .githooks/ and are activated with
 * `git config core.hooksPath`, which is a per-clone setting rather than
 * something the repository carries. Without this step a fresh clone has the
 * hooks on disk and none of them running, which is worse than having no hooks
 * at all: the repository looks protected and is not.
 *
 * Deliberately not husky. husky needs a package.json and a postinstall of its
 * own, which excludes the Drupal-side repositories in this ecosystem that have
 * neither, and the version in use elsewhere is on a deprecated hook-sourcing
 * style. A committed directory works everywhere and costs no dependency.
 *
 * Quiet on failure. A CI install runs this too, and there is nothing to gain
 * from failing an install because a hook could not be configured in a
 * container that will never make a commit.
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Resolved so a symlinked or /private-prefixed checkout compares equal.
const real = (target) => {
  try {
    return fs.realpathSync(target)
  } catch {
    return path.resolve(target)
  }
}

let toplevel
try {
  toplevel = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim()
} catch {
  // Not a git checkout: a published tarball. Nothing to do.
  process.exit(0)
}

// Git discovery walks upwards, so a copy of this package sitting inside
// another repository reports that repository. Writing core.hooksPath there
// would point it at a .githooks/ directory it does not have, disabling the
// hooks it does. Only configure the checkout this package is the root of.
if (real(toplevel) !== real(ROOT)) {
  process.exit(0)
}

try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], {
    cwd: ROOT,
    stdio: 'ignore',
  })
  console.log('Git hooks enabled from .githooks/')
} catch (error) {
  console.warn(`Could not enable git hooks: ${error.message}`)
  console.warn('Run `npm run hooks:install` by hand if you intend to commit.')
}
