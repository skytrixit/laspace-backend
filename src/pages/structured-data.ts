import type { BrandView } from '../brands/brands.service'
import type { FaqView } from '../faqs/faqs.service'
import type { ProjectView } from '../projects/projects.service'
import type { ServiceView } from '../services/services.service'
import type { SiteSetting } from '../settings/site-setting.entity'
import type { TestimonialView } from '../testimonials/testimonials.service'

/* ── JSON-LD ───────────────────────────────────────────────────────────────
   Ported from the website's build-time plugin (vite.config.js) and the two
   graphs hand-written into index.html, now built from the database so they
   never drift from what the pages show. Six graph families: business,
   website, breadcrumbs, FAQ, and the item lists per page.
   ------------------------------------------------------------------------ */

export type StaticSiteData = {
  site: { name: string; url: string }
  founder: { name: string; role: string }
  whyLaSpace: { title: string; body: string }[]
}

export type PageContent = {
  settings: SiteSetting
  services: ServiceView[]
  projects: ProjectView[]
  testimonials: TestimonialView[]
  brands: BrandView[]
  faqs: FaqView[]
  project?: ProjectView
}

type Ctx = { url: string; data: StaticSiteData; content: PageContent }

const abs = (url: string, src: string) => (src.startsWith('/') ? `${url}${src}` : src)

/** "Mon – Sat, 10:00 – 19:00" → an OpeningHoursSpecification, or nothing if the text does not parse. */
function openingHours(text: string) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const short = days.map((d) => d.slice(0, 3).toLowerCase())
  const m = text.toLowerCase().match(/([a-z]{3})[a-z]*\s*[–-]\s*([a-z]{3})[a-z]*.*?(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/)
  if (!m) return undefined
  const from = short.indexOf(m[1])
  const to = short.indexOf(m[2])
  if (from < 0 || to < 0) return undefined
  return [{ '@type': 'OpeningHoursSpecification', dayOfWeek: days.slice(from, to + 1), opens: m[3], closes: m[4] }]
}

const crumbs = (url: string, trail: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: `${url}${c.path}` })),
})

function business({ url, data, content }: Ctx) {
  const s = content.settings
  const address = [s.addressLine1, s.addressLine2, s.addressLine3].filter(Boolean)
  return {
    '@context': 'https://schema.org',
    '@type': 'InteriorDesignBusiness',
    '@id': `${url}/#business`,
    name: data.site.name,
    url: `${url}/`,
    logo: `${url}/brand/logo.svg`,
    image: `${url}/images/og-cover.jpg`,
    description: 'Bespoke interior design and turnkey execution studio in Visakhapatnam — full home interiors, modular kitchens, wardrobes, false ceilings and commercial interiors.',
    telephone: s.phone.replace(/\s/g, ''),
    email: s.email,
    priceRange: '$$$',
    address: address.length
      ? { '@type': 'PostalAddress', streetAddress: address[0], addressLocality: 'Visakhapatnam', addressRegion: 'Andhra Pradesh', addressCountry: 'IN' }
      : undefined,
    areaServed: [{ '@type': 'City', name: 'Visakhapatnam' }, { '@type': 'State', name: 'Andhra Pradesh' }],
    openingHoursSpecification: openingHours(s.hours),
    sameAs: [s.instagramUrl, s.facebookUrl, s.youtubeUrl].filter(Boolean),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Interior design services',
      itemListElement: content.services.map((x) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: x.name } })),
    },
  }
}

const website = ({ url, data }: Ctx) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${url}/#website`,
  url: `${url}/`,
  name: data.site.name,
  publisher: { '@id': `${url}/#business` },
  inLanguage: 'en-IN',
})

export function graphsFor(page: string, ctx: Ctx): unknown[] {
  const { url, data, content } = ctx
  const common = [business(ctx), website(ctx)]
  switch (page) {
    case 'index':
      return [
        ...common,
        { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: content.faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) },
        crumbs(url, [{ name: 'Home', path: '/' }]),
        { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Interior design services', itemListElement: content.services.map((s, i) => ({ '@type': 'ListItem', position: i + 1, name: s.name, url: `${url}/services#${s.slug}` })) },
        { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Signature spaces', itemListElement: content.projects.filter((p) => p.isFeatured).map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.title, url: `${url}/projects/${p.slug}` })) },
      ]
    case 'about':
      return [
        ...common,
        { '@context': 'https://schema.org', '@type': 'AboutPage', '@id': `${url}/about#page`, url: `${url}/about`, name: `About ${data.site.name}`, inLanguage: 'en-IN', about: { '@id': `${url}/#business` }, mainEntity: { '@type': 'Person', name: data.founder.name, jobTitle: data.founder.role, worksFor: { '@id': `${url}/#business` } } },
        crumbs(url, [{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }]),
        { '@context': 'https://schema.org', '@type': 'ItemList', name: 'What you can count on', itemListElement: data.whyLaSpace.map((w, i) => ({ '@type': 'ListItem', position: i + 1, name: w.title, description: w.body })) },
      ]
    case 'services':
      return [
        ...common,
        { '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': `${url}/services#page`, url: `${url}/services`, name: 'Interior design services', inLanguage: 'en-IN', isPartOf: { '@id': `${url}/#website` } },
        crumbs(url, [{ name: 'Home', path: '/' }, { name: 'Services', path: '/services' }]),
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Interior design services',
          itemListElement: content.services.map((s, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'Service',
              '@id': `${url}/services#${s.slug}`,
              name: s.name,
              description: s.shortDescription,
              serviceType: s.name,
              provider: { '@id': `${url}/#business` },
              areaServed: { '@type': 'City', name: 'Visakhapatnam' },
              image: s.image ? abs(url, s.image.src) : undefined,
              hasOfferCatalog: { '@type': 'OfferCatalog', name: `${s.name} — scope`, itemListElement: s.inclusions.map((item) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: item } })) },
            },
          })),
        },
      ]
    case 'projects':
      return [
        ...common,
        { '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': `${url}/projects#page`, url: `${url}/projects`, name: 'Projects', inLanguage: 'en-IN', isPartOf: { '@id': `${url}/#website` } },
        crumbs(url, [{ name: 'Home', path: '/' }, { name: 'Projects', path: '/projects' }]),
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Completed interior projects',
          numberOfItems: content.projects.length,
          itemListElement: content.projects.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: { '@type': 'CreativeWork', '@id': `${url}/projects/${p.slug}`, url: `${url}/projects/${p.slug}`, name: p.title, creator: { '@id': `${url}/#business` }, image: p.cover ? abs(url, p.cover.src) : undefined, locationCreated: { '@type': 'Place', name: `${p.location}, Visakhapatnam` }, genre: p.typeLabel ?? undefined },
          })),
        },
      ]
    case 'project': {
      const p = content.project!
      return [
        ...common,
        crumbs(url, [{ name: 'Home', path: '/' }, { name: 'Projects', path: '/projects' }, { name: p.title, path: `/projects/${p.slug}` }]),
        {
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          '@id': `${url}/projects/${p.slug}`,
          url: `${url}/projects/${p.slug}`,
          name: p.title,
          description: p.shortDescription,
          creator: { '@id': `${url}/#business` },
          genre: p.typeLabel ?? undefined,
          keywords: p.categories.join(', '),
          locationCreated: { '@type': 'Place', name: `${p.location}, Visakhapatnam` },
          dateCreated: p.yearLabel ?? undefined,
          image: [p.cover, ...p.gallery].filter(Boolean).map((m) => abs(url, m!.src)),
        },
      ]
    }
    case 'contact':
      return [
        ...common,
        { '@context': 'https://schema.org', '@type': 'ContactPage', '@id': `${url}/contact#page`, url: `${url}/contact`, name: `Contact ${data.site.name}`, inLanguage: 'en-IN', isPartOf: { '@id': `${url}/#website` }, about: { '@id': `${url}/#business` } },
        crumbs(url, [{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }]),
        { '@context': 'https://schema.org', '@type': 'ContactPoint', contactType: 'Sales', telephone: content.settings.phone.replace(/\s/g, ''), email: content.settings.email, areaServed: 'IN', availableLanguage: ['English', 'Telugu', 'Hindi'], hoursAvailable: openingHours(content.settings.hours)?.[0] },
      ]
    default:
      return common
  }
}
