import { validateEnv } from './env'

const base = {
  PUBLIC_ORIGIN: 'http://localhost:5173',
  ADMIN_ORIGIN: 'http://localhost:5174',
  DATABASE_URL: 'mysql://u:p@127.0.0.1:3306/laspace',
}

describe('validateEnv', () => {
  it('accepts a minimal valid environment and applies defaults', () => {
    const env = validateEnv(base)
    expect(env.PORT).toBe(4000)
    expect(env.SESSION_TTL_DAYS).toBe(30)
    expect(env.MEDIA_DRIVER).toBe('local')
  })

  it('coerces numeric strings', () => {
    expect(validateEnv({ ...base, PORT: '4100' }).PORT).toBe(4100)
  })

  it('lists every failure at once', () => {
    expect(() => validateEnv({ PORT: 'abc' })).toThrow(/PORT[\s\S]*PUBLIC_ORIGIN[\s\S]*DATABASE_URL/)
  })

  it('requires the S3 settings when the s3 driver is chosen', () => {
    expect(() => validateEnv({ ...base, MEDIA_DRIVER: 's3' })).toThrow(/S3_BUCKET/)
  })
})
