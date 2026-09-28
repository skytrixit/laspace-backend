import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { DataSource } from 'typeorm'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/app.setup'
import { AdminSession } from '../src/auth/admin-session.entity'
import { AdminUser } from '../src/auth/admin-user.entity'
import { hashPassword } from '../src/auth/password'
import { Brand } from '../src/brands/brand.entity'
import { Faq } from '../src/faqs/faq.entity'
import { Project } from '../src/projects/project.entity'
import { Service } from '../src/services/service.entity'
import { Testimonial } from '../src/testimonials/testimonial.entity'

/* F5 publish/unpublish visibility, F8 slug collisions, F9 no drafts or internal fields in public payloads. */
describe('content', () => {
  let app: INestApplication
  let db: DataSource
  let token: string
  let userId: number
  const tag = `e2e${Date.now()}`
  const server = () => request(app.getHttpServer())
  const admin = (method: 'get' | 'post' | 'patch' | 'put' | 'delete', path: string) =>
    server()[method](`/api/admin${path}`).set('Authorization', `Bearer ${token}`)

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
    token = (await server().post('/api/admin/auth/login').send({ email: user.email, password: 'correct horse battery' })).body.token
  })

  afterAll(async () => {
    /* Hard-delete everything this run created, soft-deleted rows included. */
    await db.getRepository(Service).createQueryBuilder().delete().where('slug LIKE :t', { t: `${tag}%` }).execute()
    await db.getRepository(Project).createQueryBuilder().delete().where('slug LIKE :t', { t: `${tag}%` }).execute()
    await db.getRepository(Testimonial).delete({ customerName: tag })
    await db.getRepository(Brand).delete({ name: tag })
    await db.getRepository(Faq).delete({ question: `${tag}?` })
    await db.getRepository(AdminSession).delete({ adminUserId: userId })
    await db.getRepository(AdminUser).delete({ id: userId })
    await app?.close()
  })

  describe('services', () => {
    let id: number

    it('creates as a draft that the public list does not show', async () => {
      const res = await admin('post', '/services').send({ name: `${tag} Service`, shortDescription: 'Draft first.', inclusions: ['One', 'Two'] })
      expect(res.status).toBe(201)
      expect(res.body.slug).toBe(`${tag}-service`)
      expect(res.body.isPublished).toBe(false)
      id = res.body.id
      const pub = await server().get('/api/services')
      expect(pub.body.some((s: { id: number }) => s.id === id)).toBe(false)
      expect((await server().get(`/api/services/${res.body.slug}`)).status).toBe(404)
    })

    it('publishing puts it on the public list, with public fields only', async () => {
      expect((await admin('patch', `/services/${id}/publish`).send({ isPublished: true })).body.isPublished).toBe(true)
      const pub = await server().get(`/api/services/${tag}-service`)
      expect(pub.status).toBe(200)
      expect(pub.body).toMatchObject({ name: `${tag} Service`, inclusions: ['One', 'Two'], image: null })
      expect(pub.body).not.toHaveProperty('isPublished')
      expect(pub.body).not.toHaveProperty('imageId')
      expect(pub.body).not.toHaveProperty('createdAt')
    })

    it('refuses a taken slug with a field message', async () => {
      const res = await admin('post', '/services').send({ name: 'Another', slug: `${tag}-service`, shortDescription: 'x' })
      expect(res.status).toBe(409)
      expect(res.body).toMatchObject({ code: 'slug_taken', fields: { slug: expect.any(String) } })
    })

    it('derives a free slug when none is given', async () => {
      const res = await admin('post', '/services').send({ name: `${tag} Service`, shortDescription: 'Same name again.' })
      expect(res.status).toBe(201)
      expect(res.body.slug).toBe(`${tag}-service-2`)
    })

    it('rejects a field the form does not send', async () => {
      const res = await admin('patch', `/services/${id}`).send({ deletedAt: null })
      expect(res.status).toBe(422)
    })

    it('soft-deletes: gone from both lists, slug still reserved', async () => {
      expect((await admin('delete', `/services/${id}`)).status).toBe(204)
      expect((await admin('get', `/services/${id}`)).status).toBe(404)
      expect((await server().get(`/api/services/${tag}-service`)).status).toBe(404)
      const again = await admin('post', '/services').send({ name: 'Reuse', slug: `${tag}-service`, shortDescription: 'x' })
      expect(again.status).toBe(409)
      const row = await db.getRepository(Service).findOne({ where: { id }, withDeleted: true })
      expect(row?.deletedAt).not.toBeNull()
    })
  })

  describe('projects', () => {
    let id: number

    it('creates with categories, filters publicly by category, and honours the featured flag', async () => {
      const res = await admin('post', '/projects').send({
        title: `${tag} Villa`,
        categories: ['Residential', `${tag}Cat`],
        typeLabel: 'Full Home',
        location: 'Rushikonda',
        shortDescription: 'A test villa.',
        isPublished: true,
      })
      expect(res.status).toBe(201)
      expect(res.body.publishedAt).not.toBeNull()
      id = res.body.id

      const byCat = await server().get(`/api/projects?category=${tag}Cat`)
      expect(byCat.body.map((p: { id: number }) => p.id)).toEqual([id])
      expect(byCat.body[0]).not.toHaveProperty('isPublished')

      expect((await server().get('/api/projects?featured=true')).body.some((p: { id: number }) => p.id === id)).toBe(false)
      await admin('patch', `/projects/${id}/feature`).send({ isFeatured: true })
      expect((await server().get('/api/projects?featured=true')).body.some((p: { id: number }) => p.id === id)).toBe(true)
    })

    it('rejects a gallery that names an image which does not exist', async () => {
      const res = await admin('put', `/projects/${id}/gallery`).send({ mediaIds: [999999] })
      expect(res.status).toBe(422)
      expect(res.body.fields.mediaIds).toMatch(/999999/)
      const cleared = await admin('put', `/projects/${id}/gallery`).send({ mediaIds: [] })
      expect(cleared.status).toBe(200)
      expect(cleared.body.gallery).toEqual([])
    })

    it('unpublishing hides it publicly but keeps publishedAt', async () => {
      const before = (await admin('get', `/projects/${id}`)).body.publishedAt
      await admin('patch', `/projects/${id}/publish`).send({ isPublished: false })
      expect((await server().get(`/api/projects/${tag}-villa`)).status).toBe(404)
      expect((await admin('get', `/projects/${id}`)).body.publishedAt).toBe(before)
    })
  })

  describe('testimonials, brands, faqs, settings', () => {
    it('round-trips each small resource and reorders', async () => {
      const t = await admin('post', '/testimonials').send({ customerName: tag, quote: 'Ten words or more of praise for the studio.', isPublished: true })
      const b = await admin('post', '/brands').send({ name: tag, websiteUrl: 'https://example.test', isPublished: true })
      const f = await admin('post', '/faqs').send({ question: `${tag}?`, answer: 'Because.', isPublished: true })
      expect([t.status, b.status, f.status]).toEqual([201, 201, 201])
      expect((await server().get('/api/testimonials')).body.some((x: { id: number }) => x.id === t.body.id)).toBe(true)
      expect((await server().get('/api/brands')).body.some((x: { id: number }) => x.id === b.body.id)).toBe(true)
      expect((await server().get('/api/faqs')).body.some((x: { id: number }) => x.id === f.body.id)).toBe(true)

      const bad = await admin('post', '/brands').send({ name: 'x', websiteUrl: 'not a url' })
      expect(bad.status).toBe(422)
      expect(bad.body.fields).toHaveProperty('websiteUrl')

      const list = (await admin('get', '/faqs')).body as { id: number }[]
      const reordered = await admin('put', '/faqs/reorder').send({ ids: [...list.map((x) => x.id)].reverse() })
      expect(reordered.status).toBe(200)
      expect(reordered.body[0].id).toBe(list[list.length - 1].id)
      await admin('put', '/faqs/reorder').send({ ids: list.map((x) => x.id) })
    })

    it('validates settings field by field and serves them publicly', async () => {
      /* The form sends the input shape: the row minus id and updatedAt. Anything else is a 422. */
      const { id: _id, updatedAt: _u, ...current } = (await admin('get', '/settings')).body
      const bad = await admin('put', '/settings').send({ ...current, phoneHref: 'call me' })
      expect(bad.status).toBe(422)
      expect(bad.body.fields).toHaveProperty('phoneHref')
      const ok = await admin('put', '/settings').send({ ...current, hours: current.hours || 'Mon – Sat, 10:00 – 19:00' })
      expect(ok.status).toBe(200)
      expect((await admin('put', '/settings').send({ ...current, id: 1 })).status).toBe(422)
      const pub = await server().get('/api/site-settings')
      expect(pub.status).toBe(200)
      expect(pub.body.email).toBe(current.email)
    })
  })
})
