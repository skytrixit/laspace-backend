import { join } from 'node:path'
import type { DataSourceOptions } from 'typeorm'
import { ENTITIES } from './entities'

/* ── Data source ───────────────────────────────────────────────────────────
   One options factory, two callers. The API connects as the app user, which
   can only read and write rows. The migration CLI connects as the migrate
   user, which may also alter tables. Leave the migrate credentials blank to
   use one user for both.
   ------------------------------------------------------------------------ */

export type DbRole = 'app' | 'migrate'

export type DbEnv = {
  DB_HOST: string
  DB_PORT: number
  DB_NAME: string
  DB_USERNAME: string
  DB_PASSWORD: string
  DB_MIGRATE_USERNAME?: string
  DB_MIGRATE_PASSWORD?: string
}

export function dataSourceOptions(env: DbEnv, role: DbRole): DataSourceOptions {
  const migrate = role === 'migrate' && env.DB_MIGRATE_USERNAME
  return {
    type: 'mysql',
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    username: migrate ? env.DB_MIGRATE_USERNAME! : env.DB_USERNAME,
    password: migrate ? env.DB_MIGRATE_PASSWORD ?? '' : env.DB_PASSWORD,
    entities: ENTITIES,
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    migrationsTableName: 'schema_migrations',
    /* Never true. The schema changes only through migration files, so
       what runs in production is exactly what was reviewed. */
    synchronize: false,
    charset: 'utf8mb4_unicode_ci',
    timezone: 'Z',
    logging: false,
  }
}

/** The DbEnv the CLI tools read straight off process.env (the API goes through ConfigService). */
export function dbEnvFromProcess(env: NodeJS.ProcessEnv = process.env): DbEnv {
  return {
    DB_HOST: env.DB_HOST ?? '127.0.0.1',
    DB_PORT: Number(env.DB_PORT ?? 3306),
    DB_NAME: env.DB_NAME ?? 'laspace',
    DB_USERNAME: env.DB_USERNAME ?? '',
    DB_PASSWORD: env.DB_PASSWORD ?? '',
    DB_MIGRATE_USERNAME: env.DB_MIGRATE_USERNAME || undefined,
    DB_MIGRATE_PASSWORD: env.DB_MIGRATE_PASSWORD || undefined,
  }
}
