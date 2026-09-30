import { existsSync } from 'node:fs'
import path from 'node:path'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import sharp from 'sharp'
import request from 'supertest'
import { DataSource } from 'typeorm'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/app.setup'
import { AdminSession } from '../src/auth/admin-session.entity'
import { AdminUser } from '../src/auth/admin-user.entity'
import { hashPassword } from '../src/auth/password'
import { MediaAsset } from '../src/media/media-asset.entity'
import { MediaWorker } from '../src/media/media-worker'
import { Project } from '../src/projects/project.entity'

/* F6 — upload → fifteen derivatives → attached to a project → removed with its files. */
describe('media', () => {
  jest.setTimeout(120_000)
  let app: INestApplication
  let db: DataSource
  let token: string
  let userId: number
  const tag = `e2e${Date.now()}`
  const server = () => request(app.getHttpServer())
  const admin = (method: 'get' | 'post' | 'patch' | 'put' | 'delete', p: string) =>
    server()[method](`/api/admin${p}`).set('Authorization', `Bearer ${token}`)
  const storageRoot = path.resolve(process.env.MEDIA_LOCAL_PATH ?? './storage')

  beforeAll(async () => {
    process.loadEnvFile?.('.env')
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = configureApp(moduleRef.createNestApplication({ logger: false }))
    await app.init()
    db = app.get(DataSource)
    const user = await db.getRepository(AdminUser).save({ email: `${tag}@owner.test`, passwordHash: await hashPassword('correct horse battery'), displayName: 'E2E', initials: 'EO' })
    userId = user.id
    token = (await server().post('/api/admin/auth/login').send({ email: user.email, password: 'correct horse battery' })).body.token
  })

  afterAll(async () => {
    await db.getRepository(Project).createQueryBuilder().delete().where('slug LIKE :t', { t: `${tag}%` }).execute()
    await db.getRepository(AdminSession).delete({ adminUserId: userId })
    await db.getRepository(AdminUser).delete({ id: userId })
    await app?.close()
  })

  it('refuses a file that is not an image, and a request with no file', async () => {
    const res = await admin('post', '/media').attach('file', Buffer.from('plain text pretending'), 'photo.jpg')
    expect(res.status).toBe(415)
    expect(res.body.fields.file).toMatch(/JPEG/)
    expect((await admin('post', '/media').field('alt', 'x')).status).toBe(422)
    expect((await server().post('/api/admin/media')).status).toBe(401)
  })

  it('takes a 6000px render, returns 202, and the worker produces the full set', async () => {
    const render = await sharp({ create: { width: 6000, height: 4000, channels: 3, background: { r: 120, g: 90, b: 60 } } })
      .composite([{ input: await sharp({ create: { width: 2000, height: 2000, channels: 3, background: '#c29d62' } }).png().toBuffer(), left: 500, top: 800 }])
      .jpeg({ quality: 92 })
      .toBuffer()
    expect(render.byteLength).toBeGreaterThan(100_000)

    const started = Date.now()
    const res = await admin('post', '/media').field('alt', 'Test render').attach('file', render, 'villa-render.jpg')
    expect(res.status).toBe(202)
    expect(res.body).toMatchObject({ status: 'processing', width: 6000, height: 4000, alt: 'Test render', derivatives: [] })
    const id: number = res.body.id
    expect(res.body.src).toMatch(/\/media\/[0-9a-f-]{36}\/original\.jpg$/)
    expect(Date.now() - started).toBeLessThan(5000) // the request never waits on encoding

    await app.get(MediaWorker).idle()
    const ready = await admin('get', `/media/${id}`)
    expect(ready.body.status).toBe('ready')
    expect(ready.body.derivatives).toHaveLength(15)
    expect(ready.body.lqipColor).toMatch(/^#[0-9a-f]{6}$/)
    expect(ready.body.src).toMatch(/\/2400\.jpg$/)
    const widths = [...new Set<number>(ready.body.derivatives.map((d: { width: number }) => d.width))].sort((a, b) => a - b)
    expect(widths).toEqual([400, 800, 1200, 1600, 2400])
    const phone = ready.body.derivatives.find((d: { format: string; width: number }) => d.format === 'avif' && d.width === 800)
    expect(phone.bytes).toBeLessThan(100 * 1024) // the §15 budget for a phone's largest image
    for (const d of ready.body.derivatives) expect(existsSync(path.join(storageRoot, d.key))).toBe(true)
    console.log(`  6000px render → 15 files in ${((Date.now() - started) / 1000).toFixed(1)}s; 800px avif = ${(phone.bytes / 1024).toFixed(0)} KB`)

    const served = await server().get(`/media/${phone.key.replace(/^media\//, '')}`)
    expect(served.status).toBe(200)
    expect(served.headers['content-type']).toBe('image/avif')
    expect(served.headers['cache-control']).toMatch(/immutable/)
    expect(served.headers['cross-origin-resource-policy']).toBe('cross-origin')

    const project = await admin('post', '/projects').send({ title: `${tag} Villa`, categories: ['Residential'], location: 'Test', shortDescription: 'x', coverId: id })
    expect(project.status).toBe(201)
    expect(project.body.cover.id).toBe(id)
    const gallery = await admin('put', `/projects/${project.body.id}/gallery`).send({ mediaIds: [id] })
    expect(gallery.body.gallery.map((g: { id: number }) => g.id)).toEqual([id])

    expect((await admin('delete', `/media/${id}`)).status).toBe(204)
    for (const d of ready.body.derivatives) expect(existsSync(path.join(storageRoot, d.key))).toBe(false)
    expect(await db.getRepository(MediaAsset).findOneBy({ id })).toBeNull()
    const after = await admin('get', `/projects/${project.body.id}`)
    expect(after.body.cover).toBeNull()
    expect(after.body.gallery).toEqual([])
  })
})
