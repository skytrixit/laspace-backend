import { validateEnv } from './env'

const base = {
  PUBLIC_ORIGIN: 'http://localhost:5173',
  ADMIN_ORIGIN: 'http://localhost:5174',
  DB_NAME: 'laspace',
  DB_USERNAME: 'laspace_app',
  DB_PASSWORD: 'secret',
}

describe('validateEnv', () => {
  it('accepts a minimal valid environment and applies defaults', () => {
    const env = validateEnv(base)
    expect(env.PORT).toBe(4000)
    expect(env.SESSION_TTL_DAYS).toBe(30)
    expect(env.MEDIA_DRIVER).toBe('local')
    expect(env.DB_PORT).toBe(3306)
  })

  it('treats blank values as unset, as a .env template leaves them', () => {
    const env = validateEnv({ ...base, ALERT_TO: '', CDN_BASE_URL: '', DB_MIGRATE_USERNAME: '' })
    expect(env.ALERT_TO).toBeUndefined()
    expect(env.CDN_BASE_URL).toBeUndefined()
    expect(env.DB_MIGRATE_USERNAME).toBeUndefined()
  })

  it('coerces numeric strings', () => {
    expect(validateEnv({ ...base, PORT: '4100' }).PORT).toBe(4100)
  })

  it('lists every failure at once', () => {
    expect(() => validateEnv({ PORT: 'abc' })).toThrow(/PORT[\s\S]*PUBLIC_ORIGIN[\s\S]*DB_USERNAME/)
  })

  it('requires the S3 settings when the s3 driver is chosen', () => {
    expect(() => validateEnv({ ...base, MEDIA_DRIVER: 's3' })).toThrow(/S3_BUCKET/)
  })
})
