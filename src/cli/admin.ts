import 'reflect-metadata'
import { parseArgs } from 'node:util'
import { DataSource } from 'typeorm'
import { AdminUser } from '../auth/admin-user.entity'
import { hashPassword, MIN_PASSWORD_LENGTH } from '../auth/password'
import { dataSourceOptions, dbEnvFromProcess } from '../database/data-source'
import { promptHidden } from './prompt'

/* ── Admin account CLI ─────────────────────────────────────────────────────
   There is no self-serve sign-up or reset: the owner's account is created
   and its password changed from the server.

     npm run admin -- create --email owner@example.com --name "Thoti Balachandu" --initials TB
     npm run admin -- reset-password --email owner@example.com

   The password is prompted for (hidden), or read from ADMIN_PASSWORD for
   non-interactive use. Minimum ${MIN_PASSWORD_LENGTH} characters.
   ------------------------------------------------------------------------ */

const USAGE = `Usage:
  admin create --email <email> --name "<display name>" --initials <XX>
  admin reset-password --email <email>`

async function readPassword(): Promise<string> {
  const fromEnv = process.env.ADMIN_PASSWORD
  const password = fromEnv ?? (await promptHidden('Password: '))
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  }
  if (!fromEnv) {
    const again = await promptHidden('Again: ')
    if (again !== password) throw new Error('Passwords do not match.')
  }
  return password
}

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      email: { type: 'string' },
      name: { type: 'string' },
      initials: { type: 'string' },
    },
  })
  const [command] = positionals
  const email = values.email?.trim().toLowerCase()
  if (!command || !email) throw new Error(USAGE)

  try {
    process.loadEnvFile('.env')
  } catch {
    /* env may come from the host */
  }
  const db = new DataSource(dataSourceOptions(dbEnvFromProcess(), 'app'))
  await db.initialize()
  const users = db.getRepository(AdminUser)

  try {
    if (command === 'create') {
      if (!values.name || !values.initials) throw new Error(USAGE)
      if (await users.existsBy({ email })) throw new Error(`An account already exists for ${email}.`)
      const passwordHash = await hashPassword(await readPassword())
      const user = await users.save(
        users.create({
          email,
          passwordHash,
          displayName: values.name.trim(),
          initials: values.initials.trim().toUpperCase().slice(0, 2),
        }),
      )
      console.log(`Created ${user.email} (${user.displayName}, ${user.initials}).`)
    } else if (command === 'reset-password') {
      const user = await users.findOneBy({ email })
      if (!user) throw new Error(`No account for ${email}.`)
      user.passwordHash = await hashPassword(await readPassword())
      await users.save(user)
      /* Every existing session dies with the old password. */
      await db.getRepository('AdminSession').update({ adminUserId: user.id }, { revokedAt: new Date() })
      console.log(`Password updated for ${user.email}; all sessions signed out.`)
    } else {
      throw new Error(USAGE)
    }
  } finally {
    await db.destroy()
  }
}

main().catch((err: Error) => {
  console.error(err.message)
  process.exit(1)
})
