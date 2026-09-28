import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { DataSource } from 'typeorm'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/app.setup'
import { AdminSession } from '../src/auth/admin-session.entity'
import { AdminUser } from '../src/auth/admin-user.entity'
import { hashPassword } from '../src/auth/password'

/* F4 — login, session, revocation and brute-force limiting, end to end. */
describe('admin authentication', () => {
  let app: INestApplication
  let db: DataSource
  const email = `e2e-${Date.now()}@example.test`
  const password = 'correct horse battery'
  let userId: number

  /* Every login call counts against the throttle — 401s and 422s included,
     because the guard runs before validation — so the test tracks them. */
  let loginCalls = 0
  const login = (body: object) => {
    loginCalls += 1
    return request(app.getHttpServer()).post('/api/admin/auth/login').send(body)
  }
  const me = (token?: string) => {
    const req = request(app.getHttpServer()).get('/api/admin/auth/me')
    return token ? req.set('Authorization', `Bearer ${token}`) : req
  }

  beforeAll(async () => {
    process.loadEnvFile?.('.env')
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = configureApp(moduleRef.createNestApplication({ logger: false }))
    await app.init()
    db = app.get(DataSource)
    const user = await db.getRepository(AdminUser).save({
      email,
      passwordHash: await hashPassword(password),
      displayName: 'E2E Owner',
      initials: 'EO',
    })
    userId = user.id
  })

  afterAll(async () => {
    await db.getRepository(AdminSession).delete({ adminUserId: userId })
    await db.getRepository(AdminUser).delete({ id: userId })
    await app?.close()
  })

  it('rejects a wrong password with a stable code and no detail', async () => {
    const res = await login({ email, password: 'wrong' })
    expect(res.status).toBe(401)
    expect(res.body).toEqual({
      statusCode: 401,
      code: 'invalid_credentials',
      message: 'Those credentials do not match our records.',
    })
  })

  it('refuses admin routes without a token', async () => {
    const res = await me()
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('unauthorized')
  })

  it('validates the login body', async () => {
    const res = await login({ email: 'not-an-email', password: '', extra: true })
    expect(res.status).toBe(422)
    expect(res.body.code).toBe('validation_failed')
    expect(res.body.fields).toHaveProperty('email')
  })

  it('issues a token, serves /me, and revokes it on logout', async () => {
    const res = await login({ email, password, remember: true })
    expect(res.status).toBe(200)
    const { token, user, expiresAt } = res.body
    expect(typeof token).toBe('string')
    expect(user).toEqual({ id: userId, email, displayName: 'E2E Owner', initials: 'EO', role: 'owner' })
    /* remember: true → about 30 days out */
    expect(new Date(expiresAt).getTime() - Date.now()).toBeGreaterThan(29 * 24 * 3600 * 1000)

    /* Only the hash is stored. */
    const stored = await db.getRepository(AdminSession).findOneBy({ adminUserId: userId })
    expect(stored?.tokenHash).not.toBe(token)
    expect(stored?.tokenHash).toHaveLength(64)

    expect((await me(token)).status).toBe(200)

    const out = await request(app.getHttpServer())
      .post('/api/admin/auth/logout')
      .set('Authorization', `Bearer ${token}`)
    expect(out.status).toBe(204)

    /* The gate: after logout the old token is rejected server-side. */
    expect((await me(token)).status).toBe(401)
  })

  it('allows five login attempts per window and refuses the sixth', async () => {
    let refused: request.Response | undefined
    while (loginCalls < 6) {
      const res = await login({ email, password: 'wrong' })
      if (res.status === 429) {
        refused = res
        break
      }
      expect(res.status).toBe(401)
    }
    expect(refused?.status).toBe(429)
    expect(refused?.body.code).toBe('too_many_requests')
    expect(loginCalls).toBe(6)
  })
})
