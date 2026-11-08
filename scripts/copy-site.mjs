#!/usr/bin/env node
// Copies the website's build (web/site/dist) into dist/site, so dist/ alone
// carries everything the process serves. Hostinger's Node.js runtime hands
// the running app only dist/, node_modules/ and package.json — the repo's
// web/site/dist is not there — hence the copy. Runs last in `npm run build`,
// after `nest build` has emptied and refilled dist/.
//
// fs.cpSync rather than `cp -r`, so the build also works on Windows.
import { cpSync, existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const from = path.join(root, 'web', 'site', 'dist')
const to = path.join(root, 'dist', 'site')

if (!existsSync(path.join(from, 'index.html'))) {
  console.error(`No website build at ${from} — run "npm run build:site" first.`)
  process.exit(1)
}
rmSync(to, { recursive: true, force: true })
cpSync(from, to, { recursive: true })
console.log(`Copied ${path.relative(root, from)} → ${path.relative(root, to)}`)
