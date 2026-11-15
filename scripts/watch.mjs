/**
 * Rebuild the package when its sources change, one build at a time.
 *
 * siroc's own `--watch` cannot do this job: `build()` runs mkdist over the
 * folder exports once at startup and then watches the Rollup entrypoints
 * alone, so an edit to a component, layout, plugin or stylesheet left `dist/`
 * holding the previous copy while the watcher reported success. A consuming
 * site then reads that copy, which looks like an edit that had no effect.
 *
 * Serialised rather than debounced. A watcher that spawns a build per burst
 * can have two builds writing `dist/` at once, and if the older one finishes
 * last the output is from older source: the same stale `dist/` by a different
 * route. One build runs at a time, and a change that arrives during a build
 * sets a flag that queues exactly one more, so a burst of edits collapses
 * into a single rebuild of the final state.
 */

import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import chokidar from 'chokidar'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'src')

let building = false
let queued = false

const runBuild = () => {
  if (building) {
    queued = true
    return
  }
  building = true
  queued = false

  const started = Date.now()
  const child = spawn('npm', ['run', 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
  })

  child.on('close', (code) => {
    building = false
    if (code === 0) {
      console.log(`Built in ${Date.now() - started}ms`)
    } else {
      // Not fatal: the next save is the retry, and exiting here would make a
      // typo end the watch.
      console.error(`Build exited ${code}. Waiting for the next change.`)
    }
    if (queued) runBuild()
  })
}

// Polling is slower and costs CPU, so it is opt-in: a host whose inotify
// watchers are exhausted throws ENOSPC and exits without it.
const watcher = chokidar.watch(SRC, {
  ignoreInitial: true,
  usePolling: process.env.CHOKIDAR_USEPOLLING === '1',
  interval: Number(process.env.CHOKIDAR_INTERVAL) || 300,
})

watcher.on('error', (error) => console.error(`Watch error: ${error.message}`))
watcher.on('all', (event, file) => {
  console.log(`${event} ${path.relative(ROOT, file)}`)
  runBuild()
})

// The first build waits for `ready`, which chokidar emits once the initial
// scan has finished. chokidar installs its watches asynchronously, so a save
// landing before this point becomes part of that scan's baseline rather than
// an event, and `ignoreInitial` then drops it: the build would read the file
// and finish with no rebuild queued for the edit it raced.
watcher.once('ready', () => {
  console.log(`Watching ${path.relative(ROOT, SRC)} for changes`)
  runBuild()
})
