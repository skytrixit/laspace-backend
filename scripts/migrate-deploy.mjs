#!/usr/bin/env node
// Applies pending migrations as the migrate user. The running app only ever
// holds DATABASE_URL (rows, not schema); this is the one place the
// privileged URL is used, and it never reaches the Nest process.
//
//   npm run migrate:deploy
import { spawnSync } from 'node:child_process'

try { process.loadEnvFile('.env') } catch { /* env may come from the host */ }

const url = process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL
if (!url) {
  console.error('Set MIGRATE_DATABASE_URL (or DATABASE_URL) before deploying migrations.')
  process.exit(1)
}

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: url },
})
process.exit(result.status ?? 1)
