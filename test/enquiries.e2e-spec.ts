import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { DataSource } from 'typeorm'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/app.setup'
import { AdminSession } from '../src/auth/admin-session.entity'
import { AdminUser } from '../src/auth/admin-user.entity'
import { hashPassword } from '../src/auth/password'
import { Enquiry } from '../src/enquiries/enquiry.entity'
import { REFERENCE_PATTERN } from '../src/enquiries/reference-code'

/* F1 — a public submission lands in the database and in the admin inbox. */
describe('enquiries', () => {
  let app: INestApplication
  let db: DataSource
  let token: string
  let userId: number
  const tag = `e2e-${Date.now()}`
  const phone = `+91 9${String(Date.now()).slice(-9)}`
  let posts = 0

  const post = (body: object) => {
    posts += 1
    return request(app.getHttpServer()).post('/api/enquiries').send(body)
  }
  const admin = (method: 'get' | 'patch' | 'delete', path: string) =>
    request(app.getHttpServer())[method](`/api/admin/enquiries${path}`).set('Authorization', `Bearer ${token}`)

  const valid = {
    name: `${tag} Visitor`,
    phone,
    email: `${tag}@example.test`,
    service: 'Full Home Interiors',
    budget: '₹12 – 25 Lakhs',
    message: 'Possession next month.',
    source: 'website_form',
    website: '',
    formTs: Date.now() - 30_000,
  }

  beforeAll(async () => {
    process.loadEnvFile?.('.env')
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = configureApp(moduleRef.createNestApplication({ logger: false }))
    await app.init()
    db = app.get(DataSource)
    const user = await db.getRepository(AdminUser).save({
      email: `${tag}@owner.test`,
      passwordHash: await hashPassword('correct horse battery'),
      displayName: 'E2E Owner',
      initials: 'EO',
    })
    userId = user.id
    const res = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({ email: user.email, password: 'correct horse battery' })
    token = res.body.token
  })

  afterAll(async () => {
    await db.getRepository(Enquiry).delete({ phone })
    await db.getRepository(AdminSession).delete({ adminUserId: userId })
    await db.getRepository(AdminUser).delete({ id: userId })
    await app?.close()
  })

  it('stores a valid submission and shows it in the inbox', async () => {
    const res = await post(valid)
    expect(res.status).toBe(201)
    expect(res.body.referenceCode).toMatch(REFERENCE_PATTERN)

    const row = await db.getRepository(Enquiry).findOneBy({ referenceCode: res.body.referenceCode })
    expect(row).toMatchObject({ name: valid.name, phone, email: valid.email, serviceLabel: valid.service, isHandled: false })
    expect(row?.ipHash).toHaveLength(64)
    expect(row?.notifiedAt).toBeNull() // SMTP not configured locally → skipped, never failed

    const inbox = await admin('get', `?q=${encodeURIComponent(tag)}`)
    expect(inbox.status).toBe(200)
    expect(inbox.body.total).toBe(1)
    expect(inbox.body.items[0]).toMatchObject({ referenceCode: res.body.referenceCode })
    expect(inbox.body.items[0]).not.toHaveProperty('ipHash')
  })

  it('returns the same reference for a duplicate inside the window', async () => {
    const first = await db.getRepository(Enquiry).findOneBy({ phone })
    const res = await post(valid)
    expect(res.status).toBe(200)
    expect(res.body.referenceCode).toBe(first?.referenceCode)
  })

  it('accepts but discards a honeypot submission', async () => {
    const before = await db.getRepository(Enquiry).countBy({ phone })
    const res = await post({ ...valid, name: `${tag} Bot`, website: 'http://spam.example' })
    expect(res.status).toBe(201)
    expect(res.body.referenceCode).toMatch(REFERENCE_PATTERN)
    expect(await db.getRepository(Enquiry).countBy({ phone })).toBe(before)
  })

  it('rejects a bad phone with a field message, and any field the form does not send', async () => {
    const bad = await post({ ...valid, phone: '12' })
    expect(bad.status).toBe(422)
    expect(bad.body.fields.phone).toBe('Enter a valid phone number.')

    const sneaky = await post({ ...valid, isHandled: true })
    expect(sneaky.status).toBe(422)
    expect(sneaky.body.code).toBe('validation_failed')
  })

  it('lets the admin mark handled and delete; refuses without a token', async () => {
    const row = await db.getRepository(Enquiry).findOneBy({ phone })
    const handled = await admin('patch', `/${row!.id}`).send({ isHandled: true })
    expect(handled.status).toBe(200)
    expect(handled.body.isHandled).toBe(true)
    expect(handled.body.handledAt).not.toBeNull()

    const summary = await admin('get', '/summary')
    expect(summary.status).toBe(200)
    expect(summary.body).toMatchObject({ total: expect.any(Number), unhandled: expect.any(Number) })
    expect(summary.body.latest.length).toBeLessThanOrEqual(5)

    expect((await request(app.getHttpServer()).get('/api/admin/enquiries')).status).toBe(401)

    expect((await admin('delete', `/${row!.id}`)).status).toBe(204)
    expect((await admin('get', `/${row!.id}`)).status).toBe(404)
  })

  it('allows five submissions per hour and refuses the sixth', async () => {
    let refused: request.Response | undefined
    while (posts < 6) {
      const res = await post({ ...valid, phone: `+91 8${String(Math.random()).slice(2, 11)}` })
      if (res.status === 429) {
        refused = res
        break
      }
      expect([200, 201]).toContain(res.status)
    }
    expect(refused?.status).toBe(429)
    expect(posts).toBe(6)
    await db.getRepository(Enquiry).delete({ name: valid.name })
  })
})
