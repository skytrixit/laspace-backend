import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {
  faqs,
  services,
  projects,
  site,
  serviceBlocks,
  founder,
  whyLaSpace,
  portfolioProjects,
  contact,
} from './src/data/site.js'

const ld = (graph) => ({
  tag: 'script',
  attrs: { type: 'application/ld+json' },
  children: JSON.stringify(graph),
  injectTo: 'head',
})

/**
 * Structured data is generated from the same content module the pages render,
 * then injected into each HTML document at build time — so it ships in the
 * static HTML rather than depending on JS execution, and can never drift out
 * of sync with the copy on screen.
 */
function structuredData() {
  const crumbs = (trail) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${site.url}${c.path}`,
    })),
  })

  const graphsFor = {
    index: [
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      crumbs([{ name: 'Home', path: '/' }]),
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Interior design services',
        itemListElement: services.map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: s.name,
          url: `${site.url}${s.href}`,
        })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Signature spaces',
        itemListElement: projects.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: p.name,
          url: `${site.url}${p.href}`,
        })),
      },
    ],

    about: [
      {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        '@id': `${site.url}/about#page`,
        url: `${site.url}/about`,
        name: `About ${site.name}`,
        inLanguage: 'en-IN',
        about: { '@id': `${site.url}/#business` },
        mainEntity: {
          '@type': 'Person',
          name: founder.name,
          jobTitle: 'Founder & CEO',
          worksFor: { '@id': `${site.url}/#business` },
        },
      },
      crumbs([
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'What you can count on',
        itemListElement: whyLaSpace.map((w, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: w.title,
          description: w.body,
        })),
      },
    ],

    services: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `${site.url}/services#page`,
        url: `${site.url}/services`,
        name: 'Interior design services',
        inLanguage: 'en-IN',
        isPartOf: { '@id': `${site.url}/#website` },
      },
      crumbs([
        { name: 'Home', path: '/' },
        { name: 'Services', path: '/services' },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Interior design services',
        itemListElement: serviceBlocks.map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Service',
            '@id': `${site.url}/services#${s.id}`,
            name: s.name,
            description: s.description,
            serviceType: s.name,
            provider: { '@id': `${site.url}/#business` },
            areaServed: { '@type': 'City', name: 'Visakhapatnam' },
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: `${s.name} — scope`,
              itemListElement: s.scope.map((item) => ({
                '@type': 'Offer',
                itemOffered: { '@type': 'Service', name: item },
              })),
            },
          },
        })),
      },
    ],

    projects: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `${site.url}/projects#page`,
        url: `${site.url}/projects`,
        name: 'Projects',
        inLanguage: 'en-IN',
        isPartOf: { '@id': `${site.url}/#website` },
      },
      crumbs([
        { name: 'Home', path: '/' },
        { name: 'Projects', path: '/projects' },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Completed interior projects',
        numberOfItems: portfolioProjects.length,
        itemListElement: portfolioProjects.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'CreativeWork',
            '@id': `${site.url}/projects/${p.slug}`,
            url: `${site.url}/projects/${p.slug}`,
            name: p.name,
            creator: { '@id': `${site.url}/#business` },
            image: `${site.url}${p.image}`,
            locationCreated: { '@type': 'Place', name: `${p.location}, Visakhapatnam` },
            genre: p.type,
          },
        })),
      },
    ],

    contact: [
      {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        '@id': `${site.url}/contact#page`,
        url: `${site.url}/contact`,
        name: `Contact ${site.name}`,
        inLanguage: 'en-IN',
        isPartOf: { '@id': `${site.url}/#website` },
        about: { '@id': `${site.url}/#business` },
      },
      crumbs([
        { name: 'Home', path: '/' },
        { name: 'Contact', path: '/contact' },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'ContactPoint',
        contactType: 'Sales',
        telephone: site.phone.replace(/\s/g, ''),
        email: site.email,
        areaServed: 'IN',
        availableLanguage: ['English', 'Telugu', 'Hindi'],
        hoursAvailable: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          opens: '10:00',
          closes: '19:00',
        },
      },
    ],
  }

  return {
    name: 'la-space-structured-data',
    transformIndexHtml(html, ctx) {
      const page = ctx.path.replace(/^\//, '').replace(/\.html$/, '') || 'index'
      return (graphsFor[page] || []).map(ld)
    },
  }
}

/**
 * Serves `/about` and `/services` in dev and preview the way a static host
 * does in production, so local URLs match the canonicals.
 */
function cleanUrls() {
  const middleware = (req, _res, next) => {
    const [pathname, query = ''] = req.url.split('?')
    if (/\.[a-z0-9]+$/i.test(pathname) || pathname === '/') return next()
    const candidate = `${pathname.replace(/\/+$/, '')}.html`
    req.url = query ? `${candidate}?${query}` : candidate
    next()
  }

  return {
    name: 'la-space-clean-urls',
    configureServer: (server) => () => server.middlewares.use(middleware),
    configurePreviewServer: (server) => () => server.middlewares.use(middleware),
  }
}

export default defineConfig({
  plugins: [react(), structuredData(), cleanUrls()],
  build: {
    target: 'es2019',
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        main: 'index.html',
        about: 'about.html',
        services: 'services.html',
        projects: 'projects.html',
        contact: 'contact.html',
      },
    },
  },
})
