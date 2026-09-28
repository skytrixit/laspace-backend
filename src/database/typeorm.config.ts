import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { dataSourceOptions, dbEnvFromProcess } from './data-source'

/* CLI entry only — `npm run typeorm -- migration:run` and friends.
   Runs as the migrate user; the API never loads this file. */
try {
  process.loadEnvFile('.env')
} catch {
  /* env may come from the host */
}

export default new DataSource(dataSourceOptions(dbEnvFromProcess(), 'migrate'))
