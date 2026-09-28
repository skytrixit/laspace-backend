/**
 * Image pipeline.
 *
 * Downscales the source photography to a sane long edge for these layouts,
 * writes an optimised JPEG plus a WebP sibling, and records intrinsic
 * dimensions to src/data/imageMeta.json so every <img> can carry width and
 * height and nothing reflows as images arrive.
 *
 *   npm run images
 *
 * Re-runnable: it reads from public/images and writes back in place.
 */
import { readdir, writeFile, rename, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const DIR = 'public/images'
const MAX_EDGE = 1700 // §5: ~2000 max, 1700 is enough for these layouts
const META = 'src/data/imageMeta.json'

const files = (await readdir(DIR)).filter((f) => /\.jpe?g$/i.test(f)).sort()
const meta = {}
let before = 0
let after = 0

for (const file of files) {
  const src = path.join(DIR, file)
  before += (await stat(src)).size

  const input = sharp(src, { failOn: 'none' })
  const { width, height } = await input.metadata()
  const longEdge = Math.max(width, height)
  const scale = longEdge > MAX_EDGE ? MAX_EDGE / longEdge : 1
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)

  const resized = () => sharp(src, { failOn: 'none' }).resize(w, h, { withoutEnlargement: true })

  const tmp = path.join(DIR, `.tmp-${file}`)
  await resized().jpeg({ quality: 78, mozjpeg: true, progressive: true }).toFile(tmp)
  await rename(tmp, src)

  const webp = src.replace(/\.jpe?g$/i, '.webp')
  await resized().webp({ quality: 74 }).toFile(webp)

  after += (await stat(src)).size + (await stat(webp)).size
  meta[file] = { w, h }

  const note = scale < 1 ? `${width}x${height} -> ${w}x${h}` : `${w}x${h}`
  console.log(`  ${file.padEnd(20)} ${note}`)
}

await writeFile(META, `${JSON.stringify(meta, null, 2)}\n`)
console.log(
  `\n${files.length} images | jpeg before ${(before / 1048576).toFixed(1)}MB ` +
    `-> jpeg+webp after ${(after / 1048576).toFixed(1)}MB`
)
console.log(`wrote ${META}`)
