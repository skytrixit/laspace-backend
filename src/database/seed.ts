import 'reflect-metadata'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { DataSource, type Repository } from 'typeorm'
import { Brand } from '../brands/brand.entity'
import { Faq } from '../faqs/faq.entity'
import { MediaAsset } from '../media/media-asset.entity'
import { ProjectMedia } from '../projects/project-media.entity'
import { Project } from '../projects/project.entity'
import { Service } from '../services/service.entity'
import { SiteSetting } from '../settings/site-setting.entity'
import { Testimonial } from '../testimonials/testimonial.entity'
import { dataSourceOptions, dbEnvFromProcess } from './data-source'

/* ── Content import ────────────────────────────────────────────────────────
   Reads the public site's content module — the only copy of the studio's
   copywriting — and writes it into MySQL. Re-runnable: every row is matched
   by its natural key (slug, question, name…) and updated, never duplicated.
   Decisions applied: the website's six services seed the catalogue; all
   sixteen projects come across, the four from the home page marked featured.

     npm run seed             # import
     npm run seed -- --verify # compare the database to site.js, exit 1 on drift

   WEBSITE_DIR points at the website checkout; defaults to web/site in this repo.
   The seed needs the website's source — src/data/site.js, imageMeta.json and
   public/images — not the build that `npm run build` copies into dist/site.
   ------------------------------------------------------------------------ */

type Img = { src: string; alt: string }
type SiteData = {
  site: { phone: string; phoneHref: string; whatsappHref: string; email: string; address: string[]; social: { label: string; href: string }[] }
  contact: { hours: string; mapsUrl: string }
  stats: { value: number; label: string }[]
  serviceBlocks: { id: string; name: string; description: string; scope: string[]; image: Img }[]
  projects: { name: string; meta: string; href: string; src: string; alt: string }[]
  portfolioProjects: { slug: string; name: string; location: string; type: string; tags: string[]; image: string }[]
  testimonials: { quote: string; author: string; role: string }[]
  partners: string[]
  faqs: { q: string; a: string }[]
}

const WEBSITE_DIR = path.resolve(process.env.WEBSITE_DIR ?? path.join(process.cwd(), 'web', 'site'))
const VERIFY = process.argv.includes('--verify')

/** site.js is an ES module in an ESM package; a child node process imports it and hands back JSON. */
function loadSite(): SiteData {
  const file = path.join(WEBSITE_DIR, 'src', 'data', 'site.js')
  const json = execFileSync(
    process.execPath,
    ['--input-type=module', '-e', 'import(process.argv[1]).then((m) => process.stdout.write(JSON.stringify(m)))', '--', file],
    { encoding: 'utf8' },
  )
  return JSON.parse(json) as SiteData
}

const imageMeta = (): Record<string, { w: number; h: number; widths?: number[]; color?: string }> =>
  JSON.parse(readFileSync(path.join(WEBSITE_DIR, 'src', 'data', 'imageMeta.json'), 'utf8'))

/** The card meta on the home page: "Visakhapatnam • Full Home Interiors". */
const HOME_CATEGORIES: Record<string, string[]> = {
  'Full Home Interiors': ['Residential'],
  'Modular Kitchen': ['Kitchen', 'Residential'],
  'Living Spaces': ['Residential'],
  'Commercial Interiors': ['Commercial'],
}

type Plan = {
  media: Partial<MediaAsset>[]
  services: (Partial<Service> & { imageKey: string })[]
  projects: (Partial<Project> & { coverKey: string })[]
  testimonials: Partial<Testimonial>[]
  brands: Partial<Brand>[]
  faqs: Partial<Faq>[]
  settings: Partial<SiteSetting>
}

/** Everything site.js says, in database shape, before touching the database. */
function plan(site: SiteData): Plan {
  const meta = imageMeta()
  const media = new Map<string, Partial<MediaAsset>>()
  const asset = (src: string, alt: string) => {
    const file = path.basename(src)
    const key = `images/${file}`
    if (!media.has(key)) {
      const dims = meta[file]
      if (!dims) throw new Error(`No dimensions for ${file} in imageMeta.json — run "npm run images" in the website first`)
      const imagesDir = path.join(WEBSITE_DIR, 'public', 'images')
      const jpgBytes = statSync(path.join(imagesDir, file)).size
      const stem = file.replace(/\.jpe?g$/i, '')
      /* The same ladder scripts/images.mjs wrote for the static site — <stem>.w<width>.<ext> — so the
         pages served from the database pick the right size, exactly as the static pages did. */
      const derivatives: MediaAsset['derivatives'] = []
      for (const width of dims.widths ?? [dims.w]) {
        const height = Math.round((dims.h * width) / dims.w)
        for (const [format, ext] of [['avif', 'avif'], ['webp', 'webp'], ['jpeg', 'jpg']] as const) {
          const name = `${stem}.w${width}.${ext}`
          if (!existsSync(path.join(imagesDir, name))) continue
          derivatives.push({ format, width, height, key: `images/${name}`, bytes: statSync(path.join(imagesDir, name)).size })
        }
      }
      if (!derivatives.length) derivatives.push({ format: 'jpeg', width: dims.w, height: dims.h, key, bytes: jpgBytes })
      media.set(key, {
        storageKey: key,
        originalFilename: file,
        mime: 'image/jpeg',
        byteSize: jpgBytes,
        width: dims.w,
        height: dims.h,
        altText: alt || null,
        lqipColor: dims.color ?? null,
        status: 'ready',
        derivatives,
      })
    }
    return key
  }

  const services = site.serviceBlocks.map((b, i) => ({
    slug: b.id,
    name: b.name,
    shortDescription: b.description,
    fullDescription: null,
    inclusions: b.scope,
    isPublished: true,
    displayOrder: i + 1,
    imageKey: asset(b.image.src, b.image.alt),
  }))

  const featured = site.projects.map((p, i) => {
    const [location, typeLabel] = p.meta.split('•').map((s) => s.trim())
    return {
      slug: p.href.replace(/^\/projects\//, ''),
      title: p.name,
      typeLabel,
      categories: HOME_CATEGORIES[typeLabel] ?? ['Residential'],
      location,
      shortDescription: p.alt,
      isFeatured: true,
      isPublished: true,
      displayOrder: i + 1,
      coverKey: asset(p.src, p.alt),
    }
  })
  const portfolio = site.portfolioProjects.map((p, i) => ({
    slug: p.slug,
    title: p.name,
    typeLabel: p.type,
    categories: p.tags,
    location: p.location,
    shortDescription: `${p.type} in ${p.location}.`,
    isFeatured: false,
    isPublished: true,
    displayOrder: featured.length + i + 1,
    coverKey: asset(p.image, `${p.name} — ${p.type} in ${p.location}`),
  }))

  const social = (label: string) => site.site.social.find((s) => s.label === label)?.href ?? null
  const stat = (label: string) => site.stats.find((s) => s.label === label)?.value ?? 0

  return {
    media: [...media.values()],
    services,
    projects: [...featured, ...portfolio],
    testimonials: site.testimonials.map((t, i) => ({ customerName: t.author, attribution: t.role, quote: t.quote, isPublished: true, displayOrder: i + 1 })),
    brands: site.partners.map((name, i) => ({ name, websiteUrl: null, isPublished: true, displayOrder: i + 1 })),
    faqs: site.faqs.map((f, i) => ({ question: f.q, answer: f.a, isPublished: true, displayOrder: i + 1 })),
    settings: {
      id: 1,
      phone: site.site.phone,
      phoneHref: site.site.phoneHref,
      whatsappHref: site.site.whatsappHref,
      email: site.site.email,
      addressLine1: site.site.address[0] ?? '',
      addressLine2: site.site.address[1] ?? null,
      addressLine3: site.site.address[2] ?? null,
      hours: site.contact.hours,
      mapsUrl: site.contact.mapsUrl,
      instagramUrl: social('Instagram'),
      facebookUrl: social('Facebook'),
      youtubeUrl: social('YouTube'),
      statProjects: stat('Projects Completed'),
      statFamilies: stat('Happy Families'),
      statConcepts: stat('Design Concepts'),
      statYears: stat('Years of Combined Craft'),
    },
  }
}

/** Insert or update by a natural key; returns the row. */
async function upsert<T extends { id: number }>(repo: Repository<T>, where: Record<string, unknown>, data: Partial<T>): Promise<T> {
  const existing = await repo.findOne({ where: where as never, withDeleted: true })
  const row = existing ? Object.assign(existing, data) : repo.create(data as never)
  return repo.save(row as T)
}

async function run() {
  try {
    process.loadEnvFile('.env')
  } catch {
    /* env may come from the host */
  }
  if (!existsSync(path.join(WEBSITE_DIR, 'src', 'data', 'site.js'))) {
    throw new Error(
      `Website source not found at ${WEBSITE_DIR}. The seed reads the checkout's web/site ` +
        '(src/data/site.js, src/data/imageMeta.json, public/images), which npm run build does not ship ' +
        "in dist/ — set WEBSITE_DIR to the checkout's web/site.",
    )
  }
  const site = loadSite()
  const p = plan(site)

  const db = new DataSource(dataSourceOptions(dbEnvFromProcess(), 'app'))
  await db.initialize()
  try {
    if (VERIFY) return await verify(db, p)

    const mediaIds = new Map<string, number>()
    for (const m of p.media) {
      const row = await upsert(db.getRepository(MediaAsset), { storageKey: m.storageKey }, m)
      mediaIds.set(m.storageKey!, row.id)
    }
    for (const { imageKey, ...s } of p.services) {
      await upsert(db.getRepository(Service), { slug: s.slug }, { ...s, imageId: mediaIds.get(imageKey) ?? null })
    }
    for (const { coverKey, ...pr } of p.projects) {
      const coverId = mediaIds.get(coverKey) ?? null
      const row = await upsert(db.getRepository(Project), { slug: pr.slug }, { ...pr, coverId })
      /* The cover doubles as the first gallery render until the owner adds more. */
      if (coverId && !(await db.getRepository(ProjectMedia).existsBy({ projectId: row.id }))) {
        await db.getRepository(ProjectMedia).insert({ projectId: row.id, mediaId: coverId, position: 0 })
      }
    }
    for (const t of p.testimonials) await upsert(db.getRepository(Testimonial), { quote: t.quote }, t)
    for (const b of p.brands) await upsert(db.getRepository(Brand), { name: b.name }, b)
    for (const f of p.faqs) await upsert(db.getRepository(Faq), { question: f.question }, f)
    await upsert(db.getRepository(SiteSetting), { id: 1 }, p.settings)

    console.log(
      `Imported ${p.media.length} images, ${p.services.length} services, ${p.projects.length} projects ` +
        `(${p.projects.filter((x) => x.isFeatured).length} featured), ${p.testimonials.length} testimonials, ` +
        `${p.brands.length} brands, ${p.faqs.length} FAQs and the site settings from ${WEBSITE_DIR}.`,
    )
  } finally {
    await db.destroy()
  }
}

/** Field-by-field comparison of what site.js says against what the database holds. */
async function verify(db: DataSource, p: Plan) {
  const problems: string[] = []
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
  const compare = (what: string, expected: object, actual: object | null, fields: string[]) => {
    if (!actual) return problems.push(`${what}: missing`)
    const exp = expected as Record<string, unknown>
    const act = actual as Record<string, unknown>
    for (const f of fields) {
      if (!same(exp[f] ?? null, act[f] ?? null)) problems.push(`${what}.${f}: expected ${JSON.stringify(exp[f])}, got ${JSON.stringify(act[f])}`)
    }
  }

  for (const m of p.media) compare(`media ${m.storageKey}`, m, await db.getRepository(MediaAsset).findOneBy({ storageKey: m.storageKey }), ['width', 'height', 'altText', 'status'])
  for (const { imageKey: _i, ...s } of p.services) compare(`service ${s.slug}`, s, await db.getRepository(Service).findOneBy({ slug: s.slug }), ['name', 'shortDescription', 'inclusions', 'isPublished', 'displayOrder'])
  for (const { coverKey: _c, ...pr } of p.projects) compare(`project ${pr.slug}`, pr, await db.getRepository(Project).findOneBy({ slug: pr.slug }), ['title', 'typeLabel', 'categories', 'location', 'isFeatured', 'isPublished', 'displayOrder'])
  for (const t of p.testimonials) compare(`testimonial "${t.customerName}"`, t, await db.getRepository(Testimonial).findOneBy({ quote: t.quote }), ['customerName', 'attribution', 'isPublished'])
  for (const b of p.brands) compare(`brand ${b.name}`, b, await db.getRepository(Brand).findOneBy({ name: b.name }), ['isPublished', 'displayOrder'])
  for (const f of p.faqs) compare(`faq "${f.question}"`, f, await db.getRepository(Faq).findOneBy({ question: f.question }), ['answer', 'isPublished', 'displayOrder'])
  compare('settings', p.settings, await db.getRepository(SiteSetting).findOneBy({ id: 1 }), ['phone', 'email', 'addressLine1', 'hours', 'instagramUrl', 'statProjects', 'statYears'])

  const counts = { media: p.media.length, services: p.services.length, projects: p.projects.length, testimonials: p.testimonials.length, brands: p.brands.length, faqs: p.faqs.length }
  if (problems.length) {
    console.error(`Drift between site.js and the database (${problems.length}):\n  ${problems.join('\n  ')}`)
    process.exitCode = 1
  } else {
    console.log(`Database matches site.js: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}, settings.`)
  }
}

run().catch((err: Error) => {
  console.error(err.message)
  process.exit(1)
})
