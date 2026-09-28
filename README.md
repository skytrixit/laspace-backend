# LA Space Interiors

Luxury interior-design site — fixed navbar, shared footer, and five pages:
Home (10 sections), About (5 sections), Services (6 service blocks), Projects
(filterable 12-item portfolio) and Contact (enquiry form + location band).
React 18 + Vite multi-page build, plain CSS, no UI framework and no animation
library.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
npm run preview
npm run images   # re-process public/images after adding client photography
```

## Where things live

| Path | What |
|---|---|
| [index.html](index.html) · [about.html](about.html) · [services.html](services.html) · [projects.html](projects.html) · [contact.html](contact.html) | One real document per page — title, description, canonical, OG/Twitter and a `<noscript>` fallback each. `index.html` also carries the site-wide Organization + WebSite JSON-LD |
| [vite.config.js](vite.config.js) | Build config **and** the plugin that injects FAQPage / BreadcrumbList / ItemList JSON-LD at build time |
| [src/data/site.js](src/data/site.js) | All copy, links, phone/email and image paths — the only file content edits need |
| [src/styles/tokens.css](src/styles/tokens.css) | Every colour, hairline alpha, font stack and layout constant from the spec |
| [src/styles/base.css](src/styles/base.css) | Reset, type scale, buttons, scroll-reveal, reduced-motion |
| [src/styles/navbar.css](src/styles/navbar.css) · [home.css](src/styles/home.css) · [footer.css](src/styles/footer.css) | Per-area styles |
| [src/components/](src/components/) | Layout, Navbar, Footer, Section wrapper, Shot (the curved-image device), ConsultationModal |
| [src/styles/fields.css](src/styles/fields.css) | The underline-only form controls — declared once, used by the Contact form and the modal |
| [src/components/sections/](src/components/sections/) | The ten home-page bands, in page order |
| [src/components/about/](src/components/about/) · [services/](src/components/services/) · [contact/](src/components/contact/) | Per-page sections and the enquiry form |
| [src/pages/](src/pages/) | Home, About, Services, Projects, Contact — each composed of its sections |
| [public/](public/) | robots.txt, sitemap.xml, manifest, brand SVGs, self-hosted fonts, images |
| [scripts/images.mjs](scripts/images.mjs) | Image pipeline — downscale, optimise, emit WebP, record intrinsic sizes |
| [src/components/Img.jsx](src/components/Img.jsx) | Every photographic image: WebP + JPEG fallback, width/height from the manifest |
| [src/styles/fonts.css](src/styles/fonts.css) | `@font-face` rules for the self-hosted woff2 files |

## Images

Drop client photography into `public/images/` under the existing filenames,
then run:

```bash
npm run images
```

It downscales anything over 1700px on the long edge, rewrites the JPEG
optimised, emits a `.webp` sibling, and records every file's intrinsic
dimensions to `src/data/imageMeta.json`. [Img.jsx](src/components/Img.jsx)
reads that manifest, so each `<img>` ships with `width`/`height` and nothing
reflows as images arrive. Re-run it whenever the photography changes; it works
in place and is safe to run repeatedly.

The brand logo and monogram are SVG, so they need no processing — they stay
sharp at any size and weigh under 1KB each.

## Responsive

One breakpoint, **920px**, used by `matchMedia` for exactly two behavioural
switches: navbar mode and the sticky action bar. Everything else reflows
through `repeat(auto-fit, minmax(Xpx, 1fr))` — there are no content media
queries anywhere in the CSS.

Two notes on making that hold down to 360px:

- Any `minmax()` floor wider than a phone must be written
  `minmax(min(420px, 100%), 1fr)`. A bare `minmax(420px, 1fr)` keeps its floor
  when the container is narrower and pushes the page sideways.
- The offset gold image frames sit at `inset: -20px`, i.e. **outside** their
  image. Shot wrappers therefore reserve that room with
  `width: min(var(--shot-w), calc(100% - 48px))`, otherwise the frame is
  clipped on a narrow column. Same for `.arch` on the home page.

## Design tokens

Do not substitute. Colours, sizes and timings are locked to the approved spec in
`tokens.css` and the per-area stylesheets — gold `#C29D62`, gold-dark `#8A6D3F`,
cream `#F2EDE6`, taupe `#C4AD93`, black `#000000`, off-black `#0D0C0A`.
Cormorant Garamond for display, Jost for UI. Single breakpoint: **920px**.

## Motion

All animation is CSS transitions plus `IntersectionObserver`:

- Scroll reveal — one-shot, unobserves after firing; threshold `0.1` on Home
  and About, `0.08` on Services, whose blocks are taller ([useReveal.js](src/hooks/useReveal.js)).
  Projects and Contact deliberately have **no** reveal — the Projects grid
  re-renders on filter changes, and Contact is all near the fold
- Stat count-up — threshold `0.3`, 1600ms, ease-out-cubic, fires once ([Stats.jsx](src/components/sections/Stats.jsx))
- Hero carousel — 6000ms auto-advance, restarts on pass click ([Hero.jsx](src/components/sections/Hero.jsx))
- Partner ribbon — doubled list, `translateX(-50%)` over 36s

`prefers-reduced-motion: reduce` skips the reveal, hero autoplay, marquee and
scroll-cue pulse, and jumps the counters straight to their final values.

## SEO

- Head meta ships in the static HTML, not injected by React, so a crawler gets
  title, description, canonical and social cards with zero JS execution.
- Structured data is generated from `src/data/site.js` at build time by the
  `la-space-structured-data` plugin, so the FAQ markup can never drift from the
  FAQ copy on screen. Six graphs total: InteriorDesignBusiness, WebSite,
  FAQPage, BreadcrumbList and two ItemLists.
- Semantic landmarks (`header` / `nav` / `main` / `footer`), one `h1`, ordered
  heading levels, descriptive `alt` on every content image, `alt=""` on
  decorative ones, `aria-label` on icon-only buttons, `aria-expanded` +
  `aria-controls` on FAQ triggers, and a skip link.
- First hero frame is `fetchpriority="high"`; everything below the fold is
  `loading="lazy"`.
- `public/robots.txt` and `public/sitemap.xml` — update the sitemap as pages ship.
- Fonts are self-hosted from `public/fonts` (latin + latin-ext woff2), so there
  is no render-blocking third-party request on the critical path. The two faces
  that always paint above the fold are preloaded in `index.html`.

- Each page gets its own structured data, all generated from `src/data/site.js`:
  Home carries FAQPage and two ItemLists; About carries AboutPage + Person (the
  founder); Services carries CollectionPage plus a `Service` per discipline with
  its scope as an OfferCatalog; Projects carries CollectionPage plus a
  CreativeWork per project; Contact carries ContactPage + ContactPoint with
  opening hours.

### Clean URLs

Pages are served at `/about` and `/services`, matching their canonicals. Most
static hosts (Netlify, Vercel, Cloudflare Pages) resolve `/about` → `about.html`
automatically; on nginx or Apache add the equivalent rewrite. The `cleanUrls`
plugin in `vite.config.js` does the same in dev and preview so local URLs match
production.

### Adding project detail pages

Project cards link to `/projects/<slug>` using the slugs in
`portfolioProjects`. Those documents do not exist yet. For each one, add
`projects/<slug>.html` with its own head meta, register it under
`build.rollupOptions.input` in `vite.config.js`, give it a `CreativeWork`
graph in the `structuredData` plugin, and add its `<url>` to
`public/sitemap.xml`. Navbar and card links are plain `<a href>`, so no router
is needed and each page is independently crawlable.

### The consultation modal

Every **"Book a Consultation"** CTA opens a modal enquiry form in place rather
than navigating. It is mounted once in [Layout.jsx](src/components/Layout.jsx)
and opened by a single delegated capture-phase listener in
[ConsultationModal.jsx](src/components/ConsultationModal.jsx) that matches a
trigger by its text — so a new CTA anywhere on the site works with no wiring.
Each CTA keeps `href="/contact"` as its fallback.

Scroll locking goes through [scrollLock.js](src/lib/scrollLock.js), which is
reference-counted on purpose: opening the modal from the mobile menu closes the
menu, and an uncounted `overflow = ''` on the menu's cleanup would release the
modal's lock a tick after it was taken.

### The enquiry form

Front-end only, in [EnquiryForm.jsx](src/components/contact/EnquiryForm.jsx)
and [ConsultationModal.jsx](src/components/ConsultationModal.jsx) — both post to
the same destination.
Validation is client-side; messages are absolutely positioned so showing one
can never shift the layout. **Set `contact.formEndpoint` in `src/data/site.js`
before launch** — until it is set (and if a POST to it fails), the form falls
back to opening a pre-filled email to `site.email`, so no enquiry is lost, but
a real endpoint is what you want in production.

## Before launch

1. **Domain** — replace `https://www.laspaceinteriors.com` in `index.html`,
   `src/data/site.js`, `public/robots.txt` and `public/sitemap.xml`.
2. **Contact details** — phone, WhatsApp number, email and postal address are
   placeholders in `src/data/site.js` and in the JSON-LD in `index.html`.
   The `geo` coordinates are approximate for Visakhapatnam.
3. **Images** — `public/images/` holds stand-in photography under the final
   filenames. Replace each file in place with the client's own; no code change
   needed. `og-cover.jpg` is the 1200×630 social card, and `work-01` … `work-12`
   are the portfolio grid.
4. **Logo** — `public/brand/logo.svg` and `monogram.svg` are text-built
   stand-ins; swap for the real marks.
4b. **Founder portrait** — the About page's founder card currently holds the
   monogram. Set `founder.portrait` in `src/data/site.js` to the real image
   path; `Shot` then renders it with `object-fit: cover` and the `alt` names
   Balachandu automatically.
5. **Social** — update the Instagram / Facebook / YouTube handles in
   `src/data/site.js` and the `sameAs` array in `index.html`.
6. **Contact page** — set `contact.mapsUrl` to the studio's real Google Maps
   listing, confirm `contact.hours`, and set `contact.formEndpoint` (see above).
