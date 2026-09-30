/**
 * Image pipeline for the static photography.
 *
 * For every JPEG in public/images:
 *   1. downscales anything over 1700px on the long edge and rewrites it
 *      optimised, with a full-size WebP sibling (as before);
 *   2. writes the srcset ladder the studio API also produces for uploads —
 *      AVIF, WebP and JPEG at 400/800/1200/1600/2400px, never enlarged —
 *      as `<name>.w<width>.<ext>`;
 *   3. records intrinsic dimensions, the widths that exist and the dominant
 *      colour to src/data/imageMeta.json, which Img.jsx reads.
 *
 *   npm run images
 *
 * Re-runnable and incremental: a derivative that already exists is kept.
 * The ladder files are git-ignored and generated on the host at deploy.
 */
import { access, readdir, rename, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const DIR = 'public/images'
const MAX_EDGE = 1700
const META = 'src/data/imageMeta.json'
const WIDTHS = [400, 800, 1200, 1600, 2400]
const ENCODE = {
  avif: (img) => img.avif({ quality: 60, effort: 2 }),
  webp: (img) => img.webp({ quality: 78 }),
  jpg: (img) => img.jpeg({ quality: 80, mozjpeg: true, progressive: true }),
}

const exists = (p) => access(p).then(() => true, () => false)

const files = (await readdir(DIR)).filter((f) => /^[^.]+\.jpe?g$/i.test(f)).sort()
const meta = {}
let written = 0
let kept = 0

for (const file of files) {
  const src = path.join(DIR, file)
  const input = sharp(src, { failOn: 'none' })
  const { width, height } = await input.metadata()
  const longEdge = Math.max(width, height)
  const scale = longEdge > MAX_EDGE ? MAX_EDGE / longEdge : 1
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)

  const resized = () => sharp(src, { failOn: 'none' }).resize(w, h, { withoutEnlargement: true })

  if (scale < 1) {
    const tmp = path.join(DIR, `.tmp-${file}`)
    await resized().jpeg({ quality: 78, mozjpeg: true, progressive: true }).toFile(tmp)
    await rename(tmp, src)
  }
  const webp = src.replace(/\.jpe?g$/i, '.webp')
  if (!(await exists(webp))) await resized().webp({ quality: 74 }).toFile(webp)

  /* The ladder: standard widths below the image, plus the image itself under 2400. */
  const widths = WIDTHS.filter((x) => x < w)
  if (w <= WIDTHS[WIDTHS.length - 1]) widths.push(w)
  const base = src.replace(/\.jpe?g$/i, '')
  for (const width of widths) {
    for (const [ext, encode] of Object.entries(ENCODE)) {
      const out = `${base}.w${width}.${ext}`
      if (await exists(out)) {
        kept++
        continue
      }
      await encode(sharp(src, { failOn: 'none' }).rotate().resize({ width, withoutEnlargement: true })).toFile(out)
      written++
    }
  }

  const { dominant } = await sharp(src).resize(64, 64, { fit: 'inside' }).stats()
  const hex = (n) => n.toString(16).padStart(2, '0')
  meta[file] = { w, h, widths, color: `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}` }
  console.log(`  ${file.padEnd(20)} ${w}x${h}  ladder ${widths.join('/')}`)
}

await writeFile(META, `${JSON.stringify(meta, null, 2)}\n`)
const ladder = await readdir(DIR).then((all) => all.filter((f) => /\.w\d+\.(avif|webp|jpg)$/.test(f)))
const bytes = (await Promise.all(ladder.map((f) => stat(path.join(DIR, f))))).reduce((s, x) => s + x.size, 0)
console.log(`\n${files.length} images | ladder: ${ladder.length} files, ${(bytes / 1048576).toFixed(1)} MB (${written} written, ${kept} kept)`)
console.log(`wrote ${META}`)
