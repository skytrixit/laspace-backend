import { existsSync } from 'node:fs'
import path from 'node:path'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { DataSource } from 'typeorm'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/app.setup'
import { AdminSession } from '../src/auth/admin-session.entity'
import { AdminUser } from '../src/auth/admin-user.entity'
import { hashPassword } from '../src/auth/password'
import { PagesCache } from '../src/pages/pages-cache'

/* The public pages: the website's build served with the database content
   injected. Needs a site build at SITE_DIST and the seeded database. */

const ld = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]) as Record<string, unknown>)
const data = (html: string) => JSON.parse(html.match(/<script id="__DATA__" type="application\/json">([\s\S]*?)<\/script>/)![1]) as Record<string, any>

const hasBuild = existsSync(path.resolve(process.env.SITE_DIST ?? './dist/site', 'index.html'))
if (!hasBuild) console.warn('pages e2e skipped: no website build at SITE_DIST')

;(hasBuild ? describe : describe.skip)('public pages', () => {
  let app: INestApplication
  let ds: DataSource
  let cache: PagesCache
  let token: string
  let userId: number
  const tag = `e2e${Date.now()}`
  /* The edit test renames a seeded project; whatever happens, the name goes back. */
  let renamed: { id: number; title: string } | undefined

  beforeAll(async () => {
    process.loadEnvFile?.('.env')
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = configureApp(moduleRef.createNestApplication({ logger: false }))
    await app.init()
    ds = app.get(DataSource)
    cache = app.get(PagesCache)
    const user = await ds.getRepository(AdminUser).save({
      email: `${tag}@owner.test`,
      passwordHash: await hashPassword('correct horse battery'),
      displayName: 'E2E Owner',
      initials: 'EO',
    })
    userId = user.id
    token = (await request(app.getHttpServer()).post('/api/admin/auth/login').send({ email: user.email, password: 'correct horse battery' })).body.token
  })

  afterAll(async () => {
    if (renamed) await ds.query('UPDATE project SET title = ? WHERE id = ?', [renamed.title, renamed.id])
    await ds.getRepository(AdminSession).delete({ adminUserId: userId })
    await ds.getRepository(AdminUser).delete({ id: userId })
    await app?.close()
  })

  it('serves the home page with the content block and the structured data built from the database', async () => {
    const res = await request(app.getHttpServer()).get('/').expect(200).expect('Content-Type', /text\/html/)
    expect(res.headers['cache-control']).toContain('s-maxage=300')
    const d = data(res.text)
    expect(d.services.length).toBeGreaterThan(0)
    expect(d.projects.length).toBeGreaterThan(0)
    expect(d.faqs.length).toBeGreaterThan(0)
    expect(d.settings.phone).toBeTruthy()
    // list pages never carry the heavy fields
    expect(d.projects[0].gallery).toEqual([])
    expect(d.projects[0].fullDescription).toBeNull()
    const types = ld(res.text).map((g) => g['@type'])
    expect(types).toEqual(expect.arrayContaining(['InteriorDesignBusiness', 'WebSite', 'FAQPage', 'BreadcrumbList', 'ItemList']))
    const faq = ld(res.text).find((g) => g['@type'] === 'FAQPage') as { mainEntity: unknown[] }
    expect(faq.mainEntity).toHaveLength(d.faqs.length)
  })

  it('carries the tracking tags only when they are configured', async () => {
    const res = await request(app.getHttpServer()).get('/').expect(200)
    const id = process.env.GA4_MEASUREMENT_ID
    if (id) expect(res.text).toContain(`gtag/js?id=${id}`)
    else expect(res.text).not.toContain('googletagmanager')
    const token = process.env.GOOGLE_SITE_VERIFICATION
    if (token) expect(res.text).toContain(`<meta name="google-site-verification" content="${token}">`)
    else expect(res.text).not.toContain('google-site-verification')
  })

  it.each(['/about', '/services', '/projects', '/contact'])('serves %s', async (path) => {
    const res = await request(app.getHttpServer()).get(path).expect(200)
    expect(res.text).toContain('id="__DATA__"')
    expect(ld(res.text).length).toBeGreaterThanOrEqual(3)
  })

  it('serves a project page with its gallery, head tokens filled and a CreativeWork graph', async () => {
    const [{ slug, title }] = (await ds.query('SELECT slug, title FROM project WHERE is_published = 1 ORDER BY display_order, id LIMIT 1')) as { slug: string; title: string }[]
    const res = await request(app.getHttpServer()).get(`/projects/${slug}`).expect(200)
    expect(res.text).toContain(`<title>${title} | LA Space Interiors</title>`)
    expect(res.text).toContain(`<link rel="canonical" href="https://www.laspaceinteriors.in/projects/${slug}" />`)
    expect(res.text).not.toContain('__PROJECT_')
    const d = data(res.text)
    expect(d.project.slug).toBe(slug)
    expect(Array.isArray(d.project.gallery)).toBe(true)
    const work = ld(res.text).find((g) => g['@type'] === 'CreativeWork') as { name: string; url: string }
    expect(work.name).toBe(title)
    expect(work.url).toBe(`https://www.laspaceinteriors.in/projects/${slug}`)
  })

  it('answers an unknown project with a 404 page', async () => {
    const res = await request(app.getHttpServer()).get('/projects/does-not-exist').expect(404)
    expect(res.text).toContain('Not found')
    expect(res.headers['cache-control']).toBe('no-store')
  })

  it('redirects the build file names to the clean URLs', async () => {
    await request(app.getHttpServer()).get('/about.html').expect(301).expect('Location', '/about')
    await request(app.getHttpServer()).get('/index.html').expect(301).expect('Location', '/')
  })

  it('lists every published project in the sitemap', async () => {
    const res = await request(app.getHttpServer()).get('/sitemap.xml').expect(200).expect('Content-Type', /application\/xml/)
    const [{ n }] = (await ds.query('SELECT COUNT(*) AS n FROM project WHERE is_published = 1 AND deleted_at IS NULL')) as { n: string | number }[]
    const projectUrls = res.text.match(/<loc>https:\/\/www\.laspaceinteriors\.in\/projects\/[^<]+<\/loc>/g) ?? []
    expect(projectUrls).toHaveLength(Number(n))
    expect(res.text).toContain('<loc>https://www.laspaceinteriors.in/services</loc>')
  })

  it('shows an admin edit on the next request', async () => {
    const [{ id, title }] = (await ds.query('SELECT id, title FROM project WHERE is_published = 1 ORDER BY id LIMIT 1')) as { id: number; title: string }[]
    renamed = { id, title }
    await request(app.getHttpServer()).get('/projects').expect(200)
    expect(cache.size).toBeGreaterThan(0)

    await request(app.getHttpServer()).patch(`/api/admin/projects/${id}`).set('Authorization', `Bearer ${token}`).send({ title: `${title} (edited)` }).expect(200)
    expect(cache.size).toBe(0)
    const after = await request(app.getHttpServer()).get('/projects').expect(200)
    expect(data(after.text).projects.some((p: { title: string }) => p.title === `${title} (edited)`)).toBe(true)

    await request(app.getHttpServer()).patch(`/api/admin/projects/${id}`).set('Authorization', `Bearer ${token}`).send({ title }).expect(200)
  })
})
