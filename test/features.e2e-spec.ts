import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { DataSource } from 'typeorm'

/* Locked admin sections (FEATURE_* false): 403 from their admin endpoints,
   the flags in the sign-in responses, everything else untouched.

   The flags are read when AppModule is first imported — ConfigModule.forRoot
   validates the environment at import time — so this spec sets them and
   then loads the app, instead of importing it at the top of the file. */
describe('admin feature flags', () => {
  let app: INestApplication
  let db: DataSource
  let token: string
  let userId: number
  let cleanup: () => Promise<void>
  const email = `e2e-features-${Date.now()}@example.test`
  const password = 'correct horse battery'

  const server = () => app.getHttpServer()
  const get = (path: string) => request(server()).get(path).set('Authorization', `Bearer ${token}`)

  beforeAll(async () => {
    process.loadEnvFile?.('.env')
    process.env.FEATURE_FAQS = 'false'
    process.env.FEATURE_SITE_SETTINGS = 'false'
    const [{ AppModule }, { configureApp }, { AdminUser }, { AdminSession }, { hashPassword }] = await Promise.all([
      import('../src/app.module'),
      import('../src/app.setup'),
      import('../src/auth/admin-user.entity'),
      import('../src/auth/admin-session.entity'),
      import('../src/auth/password'),
    ])
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = configureApp(moduleRef.createNestApplication({ logger: false }))
    await app.init()
    db = app.get(DataSource)
    const user = await db
      .getRepository(AdminUser)
      .save({ email, passwordHash: await hashPassword(password), displayName: 'E2E Features', initials: 'EF' })
    userId = user.id
    cleanup = async () => {
      await db.getRepository(AdminSession).delete({ adminUserId: userId })
      await db.getRepository(AdminUser).delete({ id: userId })
    }
    const res = await request(server()).post('/api/admin/auth/login').send({ email, password, remember: false })
    expect(res.status).toBe(200)
    expect(res.body.features).toEqual({ faqs: false, siteSettings: false })
    token = res.body.token
  })

  afterAll(async () => {
    await cleanup?.()
    await app?.close()
  })

  it('tells the panel which sections are locked', async () => {
    const res = await get('/api/admin/auth/me')
    expect(res.status).toBe(200)
    expect(res.body.features).toEqual({ faqs: false, siteSettings: false })
  })

  it('answers 403 feature_locked on every route of a locked section', async () => {
    for (const path of ['/api/admin/faqs', '/api/admin/faqs/1', '/api/admin/settings']) {
      const res = await get(path)
      expect(res.status).toBe(403)
      expect(res.body).toMatchObject({ statusCode: 403, code: 'feature_locked' })
    }
    const put = await request(server()).put('/api/admin/settings').set('Authorization', `Bearer ${token}`).send({})
    expect(put.status).toBe(403)
    const post = await request(server()).post('/api/admin/faqs').set('Authorization', `Bearer ${token}`).send({})
    expect(post.status).toBe(403)
  })

  it('still asks for a sign-in before saying a section is locked', async () => {
    const res = await request(server()).get('/api/admin/faqs')
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('unauthorized')
  })

  it('leaves the other admin sections and the public endpoints alone', async () => {
    expect((await get('/api/admin/brands')).status).toBe(200)
    expect((await get('/api/admin/enquiries/summary')).status).toBe(200)
    expect((await request(server()).get('/api/faqs')).status).toBe(200)
    expect((await request(server()).get('/api/site-settings')).status).toBe(200)
  })
})
