import sharp from 'sharp'
import { dominantColor, encode, inspect, planWidths } from './image-processing'

describe('planWidths', () => {
  it('uses the whole ladder for a large render', () => {
    expect(planWidths(6000)).toEqual([400, 800, 1200, 1600, 2400])
  })
  it('never upscales: a 1400px original tops out at 1400', () => {
    expect(planWidths(1400)).toEqual([400, 800, 1200, 1400])
  })
  it('a tiny image gets just itself', () => {
    expect(planWidths(300)).toEqual([300])
  })
  it('exactly 2400 is the ladder with the original as its top', () => {
    expect(planWidths(2400)).toEqual([400, 800, 1200, 1600, 2400])
  })
})

describe('inspect / encode', () => {
  const png = () => sharp({ create: { width: 640, height: 480, channels: 3, background: '#c29d62' } }).png().toBuffer()

  it('reads the real container and rejects non-images', async () => {
    const info = await inspect(await png())
    expect(info).toMatchObject({ format: 'png', mime: 'image/png', width: 640, height: 480 })
    await expect(inspect(Buffer.from('not an image'))).rejects.toMatchObject({ status: 415 })
  })

  it('finds a placeholder colour close to the image (the histogram is binned)', async () => {
    const hex = await dominantColor(await png())
    const channel = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16)
    for (const i of [0, 1, 2]) expect(Math.abs(channel(hex, i) - channel('#c29d62', i))).toBeLessThanOrEqual(12)
  })

  it('encodes each format at the requested width without enlarging', async () => {
    const src = await png()
    for (const format of ['avif', 'webp', 'jpeg'] as const) {
      const { info } = await encode(src, 320, format)
      expect(info.width).toBe(320)
      expect(info.height).toBe(240)
    }
    expect((await encode(src, 5000, 'jpeg')).info.width).toBe(640)
  })
})
