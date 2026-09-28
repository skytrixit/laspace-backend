#!/usr/bin/env node
// Writes a new migration by diffing schema.prisma against the current state,
// without a shadow database — so it works with the least-privilege migrate
// user, which may not CREATE DATABASE.
//
//   npm run migrate:new -- add_project_video
//
// First migration: diffed from empty. Later ones: diffed from the live
// database, which must already be at the latest migration (run
// migrate:deploy first).
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

try { process.loadEnvFile('.env') } catch { /* optional */ }

const name = (process.argv[2] || '').replace(/[^a-z0-9_]/gi, '_').toLowerCase()
if (!name) {
  console.error('Usage: npm run migrate:new -- <snake_case_name>')
  process.exit(1)
}

const dir = 'prisma/migrations'
const existing = existsSync(dir) ? readdirSync(dir).filter((d) => /^\d{14}_/.test(d)) : []

const from = existing.length === 0
  ? ['--from-empty']
  : ['--from-url', process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL]

if (from[0] === '--from-url' && !from[1]) {
  console.error('Set MIGRATE_DATABASE_URL to diff against the live database.')
  process.exit(1)
}

const diff = spawnSync(
  'npx',
  ['prisma', 'migrate', 'diff', ...from, '--to-schema-datamodel', 'prisma/schema.prisma', '--script'],
  { encoding: 'utf8', env: process.env },
)
if (diff.status !== 0) {
  process.stderr.write(diff.stderr)
  process.exit(diff.status ?? 1)
}

const sql = diff.stdout.trim()
if (!sql || /^-- This is an empty migration/.test(sql)) {
  console.log('Schema matches the current state — nothing to migrate.')
  process.exit(0)
}

const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
const folder = join(dir, `${stamp}_${name}`)
mkdirSync(folder, { recursive: true })
writeFileSync(join(folder, 'migration.sql'), `${sql}\n`)
if (!existsSync(join(dir, 'migration_lock.toml'))) {
  writeFileSync(join(dir, 'migration_lock.toml'), '# Managed by Prisma. Do not edit.\nprovider = "mysql"\n')
}
console.log(`Wrote ${folder}/migration.sql — review it, then npm run migrate:deploy`)
