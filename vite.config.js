import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { site, founder, whyLaSpace, preloader } from './src/data/site.js'

/**
 * The static copy the studio API needs when it injects JSON-LD — the studio
 * name and URL, the founder, the "why us" list. Everything content-driven
 * (services, projects, FAQs, contact details) comes from the database, so
 * the API is the one place that builds structured data now.
 */
function emitStaticData() {
  return {
    name: 'la-space-static-data',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'site-data.json',
        source: JSON.stringify(
          {
            site: { name: site.name, url: site.url },
            founder: { name: founder.name, role: founder.role },
            whyLaSpace: whyLaSpace.map(({ title, body }) => ({ title, body })),
          },
          null,
          2
        ),
      })
    },
  }
}

/**
 * The entry loader's switches (src/data/site.js → `preloader`) applied to
 * index.html: disabled → the overlay, its styles and its script are removed
 * entirely; once per session → the head script is told so.
 */
function preloaderSwitches() {
  return {
    name: 'la-space-preloader',
    transformIndexHtml(html) {
      if (!preloader.enabled) return html.replace(/\s*<!-- preloader:start[\s\S]*?<!-- preloader:end -->/g, '').replace(' data-preloader="every"', '')
      return html.replace('data-preloader="every"', `data-preloader="${preloader.everyVisit ? 'every' : 'once'}"`)
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
    if (/\.[a-z0-9]+$/i.test(pathname) || pathname === '/' || pathname.startsWith('/api/') || pathname.startsWith('/media/')) return next()
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
  plugins: [react(), emitStaticData(), preloaderSwitches(), cleanUrls()],
  // Same-origin /api in the browser, forwarded to the studio API in dev.
  // Same-origin /api and /media in the browser, forwarded to the studio API in dev.
  server: { proxy: { '/api': 'http://localhost:4000', '/media': 'http://localhost:4000' } },
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
        project: 'project.html',
      },
    },
  },
})
