import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { dataSourceOptions } from './data-source'

/* CLI entry only — `npm run typeorm -- migration:run` and friends.
   Runs as the migrate user; the API never loads this file. */
try {
  process.loadEnvFile('.env')
} catch {
  /* env may come from the host */
}

const env = process.env
export default new DataSource(
  dataSourceOptions(
    {
      DB_HOST: env.DB_HOST ?? '127.0.0.1',
      DB_PORT: Number(env.DB_PORT ?? 3306),
      DB_NAME: env.DB_NAME ?? 'laspace',
      DB_USERNAME: env.DB_USERNAME ?? '',
      DB_PASSWORD: env.DB_PASSWORD ?? '',
      DB_MIGRATE_USERNAME: env.DB_MIGRATE_USERNAME || undefined,
      DB_MIGRATE_PASSWORD: env.DB_MIGRATE_PASSWORD || undefined,
    },
    'migrate',
  ),
)
