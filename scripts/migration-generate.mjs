#!/usr/bin/env node
// Diffs the entities against the live database (as the migrate user) and
// writes src/database/migrations/<timestamp>-<Name>.ts.
//
//   npm run migration:generate -- AddProjectVideo
//
// Run migration:run first so the database is at the latest migration;
// otherwise the diff includes changes that are already in files.
import { spawnSync } from 'node:child_process'

const name = (process.argv[2] || '').replace(/[^A-Za-z0-9]/g, '')
if (!name) {
  console.error('Usage: npm run migration:generate -- <PascalCaseName>')
  process.exit(1)
}
const r = spawnSync(
  'npx',
  ['typeorm-ts-node-commonjs', '-d', 'src/database/typeorm.config.ts', 'migration:generate', `src/database/migrations/${name}`, '--pretty'],
  { stdio: 'inherit' },
)
process.exit(r.status ?? 1)
