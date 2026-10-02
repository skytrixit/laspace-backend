import { existsSync } from 'node:fs'
import path from 'node:path'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/app.setup'

/* Security headers on every response, and the admin panel served at /admin with its SPA fallback. */
describe('security headers and the admin panel', () => {
  let app: INestApplication
  const adminBuilt = existsSync(path.resolve(process.env.ADMIN_DIST ?? '../la_space_admin/dist', 'index.html'))

  beforeAll(async () => {
    process.loadEnvFile?.('.env')
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = configureApp(moduleRef.createNestApplication({ logger: false }))
    await app.init()
  })

  afterAll(async () => {
    await app?.close()
  })

  it('sets the security headers and never names the server', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200)
    const csp = res.headers['content-security-policy']
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/)
    expect(res.headers['strict-transport-security']).toContain('max-age=')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })

  ;(adminBuilt ? it : it.skip)('serves the admin panel at /admin and its deep links, without caching the shell', async () => {
    const root = await request(app.getHttpServer()).get('/admin').expect(200).expect('Content-Type', /text\/html/)
    expect(root.text).toContain('/admin/assets/')
    expect(root.headers['cache-control']).toBe('no-cache')
    const deep = await request(app.getHttpServer()).get('/admin/projects/1').expect(200)
    expect(deep.text).toBe(root.text)
    await request(app.getHttpServer()).get('/admin/assets/does-not-exist.js').expect(404)
    const asset = root.text.match(/\/admin\/assets\/[^"]+\.js/)![0]
    const js = await request(app.getHttpServer()).get(asset).expect(200)
    expect(js.headers['cache-control']).toContain('immutable')
  })

  it('answers a missing static file with a 404, not a 500', async () => {
    const res = await request(app.getHttpServer()).get('/assets/does-not-exist.js').expect(404)
    expect(res.body.code).toBe('not_found')
  })

  it('keeps the API behind the guard', async () => {
    await request(app.getHttpServer()).get('/api/admin/projects').expect(401)
    await request(app.getHttpServer()).post('/api/admin/projects').send({}).expect(401)
  })
})
