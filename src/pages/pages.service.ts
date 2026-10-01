import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BrandsService } from '../brands/brands.service'
import type { Env } from '../config/env'
import { FaqsService } from '../faqs/faqs.service'
import { ProjectsService, type ProjectView } from '../projects/projects.service'
import { ServicesService } from '../services/services.service'
import { SettingsService } from '../settings/settings.service'
import { TestimonialsService } from '../testimonials/testimonials.service'
import { injectHead, escapeHtml, summary, trackingHead, SHELL_CSS } from './html'
import { PagesCache } from './pages-cache'
import { graphsFor, type PageContent, type StaticSiteData } from './structured-data'

/* ── Public pages ──────────────────────────────────────────────────────────
   Serves the website's built documents with the published content injected
   as a __DATA__ block and the JSON-LD graphs built from the same rows, so
   what the admin saves is on the site at the next request. The templates
   and the static copy (site-data.json) come from the website's build.
   ------------------------------------------------------------------------ */

export const PAGES = ['index', 'about', 'services', 'projects', 'contact', 'project'] as const
export type PageName = (typeof PAGES)[number]

type Rendered = { status: number; html: string }

const FALLBACK_STATIC: StaticSiteData = {
  site: { name: 'LA Space Interiors', url: 'https://www.laspaceinteriors.com' },
  founder: { name: 'Balachandu', role: 'Founder & CEO' },
  whyLaSpace: [],
}

@Injectable()
export class PagesService implements OnModuleInit {
  private readonly log = new Logger(PagesService.name)
  private readonly templates = new Map<PageName, string>()
  private staticData: StaticSiteData = FALLBACK_STATIC
  readonly dist: string
  readonly url: string
  private readonly tracking: string[]

  constructor(
    config: ConfigService<Env, true>,
    private readonly cache: PagesCache,
    private readonly settings: SettingsService,
    private readonly services: ServicesService,
    private readonly projects: ProjectsService,
    private readonly testimonials: TestimonialsService,
    private readonly brands: BrandsService,
    private readonly faqs: FaqsService,
  ) {
    this.dist = path.resolve(config.get('SITE_DIST'))
    this.url = config.get('SITE_URL').replace(/\/+$/, '')
    this.tracking = trackingHead({ ga4Id: config.get('GA4_MEASUREMENT_ID'), siteVerification: config.get('GOOGLE_SITE_VERIFICATION') })
    if (this.tracking.length) this.log.log(`tracking tags on: ${[config.get('GA4_MEASUREMENT_ID') && 'GA4', config.get('GOOGLE_SITE_VERIFICATION') && 'site verification'].filter(Boolean).join(', ')}`)
  }

  onModuleInit() {
    this.loadBuild()
  }

  /** Reads the built templates. Called at boot and again if a page is requested while none are loaded. */
  loadBuild() {
    if (!existsSync(path.join(this.dist, 'index.html'))) {
      this.log.warn(`no website build at ${this.dist} — public pages are unavailable until the site is built`)
      return false
    }
    for (const page of PAGES) {
      const file = path.join(this.dist, `${page}.html`)
      if (existsSync(file)) this.templates.set(page, readFileSync(file, 'utf8'))
    }
    const staticFile = path.join(this.dist, 'site-data.json')
    if (existsSync(staticFile)) this.staticData = { ...FALLBACK_STATIC, ...JSON.parse(readFileSync(staticFile, 'utf8')) }
    this.log.log(`serving ${this.templates.size} page templates from ${this.dist}`)
    return true
  }

  get available() {
    return this.templates.size > 0 || this.loadBuild()
  }

  /** Everything the public site needs, from the published rows. Galleries and long copy travel only with the detail page. */
  private async content(): Promise<PageContent> {
    const [settings, services, projects, testimonials, brands, faqs] = await Promise.all([
      this.settings.get(),
      this.services.listPublic(),
      this.projects.listPublicFiltered({}),
      this.testimonials.listPublic(),
      this.brands.listPublic(),
      this.faqs.listPublic(),
    ])
    return {
      settings,
      services: services.map(this.services.toPublic),
      projects: projects.map(this.projects.toPublic).map(({ gallery: _g, fullDescription: _f, ...rest }) => ({ ...rest, gallery: [], fullDescription: null })),
      testimonials: testimonials.map(this.testimonials.toPublic),
      brands: brands.map(this.brands.toPublic),
      faqs: faqs.map(this.faqs.toPublic),
    }
  }

  async render(page: Exclude<PageName, 'project'>): Promise<Rendered> {
    const key = `page:${page}`
    const hit = this.cache.get(key)
    if (hit) return hit
    if (!this.available) return { status: 503, html: this.unavailable() }
    const template = this.templates.get(page)
    if (!template) return { status: 404, html: this.notFound() }

    const content = await this.content()
    const html = injectHead(template, content, graphsFor(page, { url: this.url, data: this.staticData, content }), {}, this.tracking)
    this.cache.set(key, 200, html)
    return { status: 200, html }
  }

  async renderProject(slug: string): Promise<Rendered> {
    const key = `project:${slug}`
    const hit = this.cache.get(key)
    if (hit) return hit
    if (!this.available) return { status: 503, html: this.unavailable() }
    const template = this.templates.get('project')
    if (!template) return { status: 404, html: this.notFound() }

    let project: ProjectView
    try {
      project = this.projects.toPublic(await this.projects.findPublicBySlug(slug))
    } catch {
      const html = this.notFound('That project is not here.')
      this.cache.set(key, 404, html)
      return { status: 404, html }
    }
    const content = { ...(await this.content()), project }
    const image = project.cover ? (project.cover.src.startsWith('/') ? `${this.url}${project.cover.src}` : project.cover.src) : `${this.url}/images/og-cover.jpg`
    const html = injectHead(template, content, graphsFor('project', { url: this.url, data: this.staticData, content }), {
      PROJECT_TITLE: project.title,
      PROJECT_DESCRIPTION: summary(project.fullDescription ?? project.shortDescription),
      PROJECT_URL: `${this.url}/projects/${project.slug}`,
      PROJECT_IMAGE: image,
    }, this.tracking)
    this.cache.set(key, 200, html)
    return { status: 200, html }
  }

  /** Every published page, with the newest change on each as lastmod. */
  async sitemap(): Promise<string> {
    const key = 'sitemap'
    const hit = this.cache.get(key)
    if (hit) return hit.html
    const [services, projects, faqs, settings] = await Promise.all([this.services.listAdmin(), this.projects.listAdmin(), this.faqs.listAdmin(), this.settings.get()])
    const latest = (dates: (Date | null | undefined)[]) => {
      const ms = dates.filter((d): d is Date => d instanceof Date).map((d) => d.getTime())
      return new Date(ms.length ? Math.max(...ms) : Date.now()).toISOString().slice(0, 10)
    }
    const published = projects.filter((p) => p.isPublished)
    const entries = [
      { loc: '/', lastmod: latest([settings.updatedAt, ...services.map((s) => s.updatedAt), ...faqs.map((f) => f.updatedAt), ...published.map((p) => p.updatedAt)]), changefreq: 'monthly', priority: '1.0' },
      { loc: '/about', lastmod: latest([settings.updatedAt]), changefreq: 'yearly', priority: '0.7' },
      { loc: '/services', lastmod: latest(services.map((s) => s.updatedAt)), changefreq: 'monthly', priority: '0.9' },
      { loc: '/projects', lastmod: latest(published.map((p) => p.updatedAt)), changefreq: 'monthly', priority: '0.9' },
      ...published.map((p) => ({ loc: `/projects/${p.slug}`, lastmod: latest([p.updatedAt]), changefreq: 'yearly', priority: '0.6' })),
      { loc: '/contact', lastmod: latest([settings.updatedAt]), changefreq: 'yearly', priority: '0.8' },
    ]
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      entries.map((e) => `  <url>\n    <loc>${escapeHtml(this.url + e.loc)}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`).join('\n') +
      `\n</urlset>\n`
    this.cache.set(key, 200, xml, 'application/xml; charset=utf-8')
    return xml
  }

  private shell(title: string, body: string) {
    return `<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title><style>${SHELL_CSS}</style></head><body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(body)}</p><a href="/">Back to LA Space Interiors →</a></main></body></html>`
  }

  private notFound(body = 'That page is not here.') {
    return this.shell('Not found', body)
  }

  private unavailable() {
    return this.shell('Back in a moment', 'The site is being updated. Please try again shortly.')
  }
}
