/**
 * What every component reads. Served by the studio API, each page carries a
 * `__DATA__` block with the published content; this module turns it into
 * the shapes the components have always used. Without it — `vite dev` on
 * its own — everything falls back to the static exports in site.js, so the
 * site still renders for design work.
 */
import * as s from './site'

/* The API writes the block as JSON, not as a script, so nothing runs before the app does. */
const readData = () => {
  if (typeof document === 'undefined') return null
  const el = document.getElementById('__DATA__')
  if (!el) return null
  try {
    return JSON.parse(el.textContent)
  } catch {
    return null
  }
}

const D = readData()

export const live = Boolean(D)

const pad = (i) => String(i + 1).padStart(2, '0')

/** The short uppercase line under a service name: the first clause of its description. */
const tagline = (text) => {
  const first = (text || '').split(/ — | – |\. |, /)[0].trim()
  return first.length > 44 ? `${first.slice(0, 41).trimEnd()}…` : first
}

/* ── Studio details ──────────────────────────────────────────────────────── */

/* The WhatsApp link with the ready message. The stored link is the bare
   number, whether from the studio's settings or site.js; a link that already
   carries a query is left alone. */
const withMessage = (href) =>
  href && !href.includes('?') ? `${href}?text=${encodeURIComponent(s.whatsappMessage)}` : href

/** Which settings field, if any, the studio uses for each channel. */
const API_SOCIAL = { Instagram: 'instagramUrl', Facebook: 'facebookUrl', YouTube: 'youtubeUrl' }

export const site = D
  ? {
      ...s.site,
      phone: D.settings.phone,
      phoneHref: D.settings.phoneHref,
      whatsappHref: withMessage(D.settings.whatsappHref),
      email: D.settings.email,
      emailHref: `mailto:${D.settings.email}`,
      address: [D.settings.addressLine1, D.settings.addressLine2, D.settings.addressLine3].filter(Boolean),
      /* The studio stores three of the channels; the rest keep their
         site.js address rather than vanishing when a page is served live.
         A field the studio has and has cleared still wins, so a channel can
         be taken down from the console. */
      social: s.site.social
        .map((c) => {
          const key = API_SOCIAL[c.label]
          return key && key in D.settings ? { ...c, href: D.settings[key] } : c
        })
        .filter((c) => c.href),
    }
  : { ...s.site, whatsappHref: withMessage(s.site.whatsappHref) }

export const contact = D
  ? { ...s.contact, hours: D.settings.hours || s.contact.hours, mapsUrl: D.settings.mapsUrl || s.contact.mapsUrl }
  : s.contact

export const stats = D
  ? [
      { value: D.settings.statProjects, label: 'Projects Completed' },
      { value: D.settings.statFamilies, label: 'Happy Families' },
      { value: D.settings.statConcepts, label: 'Design Concepts' },
      { value: D.settings.statYears, label: 'Years of Combined Craft' },
    ]
  : s.stats

/* ── Services ────────────────────────────────────────────────────────────── */

export const services = D
  ? D.services.map((x, i) => ({ no: pad(i), name: x.name, tag: tagline(x.shortDescription), href: `/services#c${i}` }))
  : s.services

/* Every block is a plain rectangle; kept as a per-position list so a shaped
   silhouette can be reintroduced without changing the mapping below. */
const RADII = ['0', '0', '0', '0', '0', '0']

export const serviceBlocks = D
  ? D.services.map((x, i) => ({
      id: x.slug,
      eyebrow: `— ${pad(i)}`,
      name: x.name,
      description: x.shortDescription,
      body: x.fullDescription,
      scope: x.inclusions,
      radius: RADII[i % RADII.length],
      image: x.image ? { media: x.image, alt: x.image.alt || x.name } : null,
    }))
  : s.serviceBlocks

export const serviceOptions = D ? D.services.map((x) => x.name) : s.serviceOptions
export const budgetOptions = s.budgetOptions

/* ── Projects ────────────────────────────────────────────────────────────── */

const SHAPES = ['arch', 'inverted', 'capsule', 'diagonal']
const PREFERRED = ['Residential', 'Kitchen', 'Wardrobe', 'Commercial']

export const projects = D
  ? D.projects
      .filter((p) => p.isFeatured)
      .slice(0, 4)
      .map((p, i) => ({
        name: p.title,
        meta: `${p.location} • ${p.typeLabel || p.categories[0] || ''}`,
        href: `/projects/${p.slug}`,
        shape: SHAPES[i % SHAPES.length],
        media: p.cover,
        src: p.cover ? p.cover.src : '',
        alt: (p.cover && p.cover.alt) || p.title,
      }))
  : s.projects

export const portfolioProjects = D
  ? D.projects.map((p) => ({
      slug: p.slug,
      name: p.title,
      location: p.location,
      type: p.typeLabel || p.categories[0] || '',
      tags: p.categories,
      media: p.cover,
      image: p.cover ? p.cover.src : '',
    }))
  : s.portfolioProjects

export const projectFilters = D
  ? [
      'All',
      ...[...new Set(D.projects.flatMap((p) => p.categories))].sort(
        (a, b) => (PREFERRED.indexOf(a) + 1 || 99) - (PREFERRED.indexOf(b) + 1 || 99) || a.localeCompare(b)
      ),
    ]
  : s.projectFilters

/** The one project a detail page is about. Null everywhere else. */
export const project = D && D.project ? D.project : null

/* ── Editorial ───────────────────────────────────────────────────────────── */

export const faqs = D ? D.faqs.map((f) => ({ q: f.question, a: f.answer })) : s.faqs

export const testimonials = D
  ? D.testimonials.map((t) => ({ quote: t.quote, author: t.customerName, role: t.attribution }))
  : s.testimonials

/** Brands: a logo and a link when the studio has set them, the name otherwise. */
export const partners = D
  ? D.brands.map((b) => ({ name: b.name, href: b.websiteUrl, logo: b.logo }))
  : s.partners.map((name) => ({ name, href: null, logo: null }))

/* ── Static copy, unchanged ──────────────────────────────────────────────── */

export const {
  credit,
  preloader,
  nav,
  heroSlides,
  whoWeAreImage,
  processSteps,
  ctaImage,
  aboutHero,
  aboutStory,
  founder,
  whyLaSpace,
  aboutCta,
  servicesHero,
} = s
