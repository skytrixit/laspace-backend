#!/usr/bin/env node
/**
 * Mobile performance budgets, enforced. Runs Lighthouse (mobile, performance
 * only) against the API-served site and exits 1 when a page misses its budget.
 *
 *   node scripts/lighthouse-budget.mjs [http://localhost:4000]
 *
 * The API must be running with the built site (and the seeded database).
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const BASE = (process.argv[2] || 'http://localhost:4000').replace(/\/$/, '')
// The projects page carries the heaviest imagery and is the budget from the plan (§15).
// The home page has the hero crossfade and more third-party-free weight; its floor guards regressions.
const BUDGETS = [
  { path: '/projects', perf: 90 },
  { path: '/', perf: 80 },
]

const dir = mkdtempSync(path.join(tmpdir(), 'lh-budget-'))
let failed = false
for (const b of BUDGETS) {
  const out = path.join(dir, `${b.path.replace(/\W/g, '') || 'home'}.json`)
  execFileSync(
    'npx',
    ['--yes', 'lighthouse@12', BASE + b.path, '--only-categories=performance', '--output=json', `--output-path=${out}`, '--chrome-flags=--headless=new --no-sandbox', '--quiet'],
    { stdio: ['ignore', 'ignore', 'inherit'] }
  )
  const r = JSON.parse(readFileSync(out, 'utf8'))
  const a = r.audits
  const score = Math.round(r.categories.performance.score * 100)
  const ok = score >= b.perf
  failed ||= !ok
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${b.path}  performance ${score} (budget ${b.perf})  LCP ${a['largest-contentful-paint'].displayValue}  CLS ${a['cumulative-layout-shift'].displayValue}  TBT ${a['total-blocking-time'].displayValue}`
  )
}
rmSync(dir, { recursive: true, force: true })
process.exit(failed ? 1 : 0)
