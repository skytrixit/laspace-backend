# Image assets

Drop the client photography here, 2400px on the long edge, JPG or WebP.
Filenames referenced by `src/data/site.js`. After adding or replacing any of
them run `npm run images` to write the srcset ladder and `imageMeta.json`.

| File | Used by |
|---|---|
| `hero-1.jpg` … `hero-4.jpg` | Hero carousel (4 slides) |
| `who-we-are.jpg` | Section 01 — arched image |
| `founder.jpg` | About page — founder portrait, shoot it portrait (3:4) |
| `project-1.jpg` … `project-4.jpg` | Portfolio grid |
| `cta.jpg` | Final CTA full-bleed background |
| `og-cover.jpg` | Social share card, 1200×630 |

The files currently in this folder are stand-in photography. Replacing one
with the client's own image **under the same filename** is the entire swap —
no code change. Keep the aspect ratios roughly as they are so the arch,
capsule and diagonal crops stay well composed.
