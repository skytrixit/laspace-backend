import { mkdir, readFile, rmdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { OWNED_KEY, type MediaStorage } from './media-storage'

/** Files under MEDIA_LOCAL_PATH, served by the API's /media route. Development only. */
export class LocalMediaStorage implements MediaStorage {
  constructor(private readonly root: string) {}

  private resolve(key: string) {
    if (!OWNED_KEY.test(key)) throw new Error(`Refusing to touch key outside the media store: ${key}`)
    return path.join(this.root, key)
  }

  async put(key: string, body: Buffer) {
    const file = this.resolve(key)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, body)
  }

  get(key: string) {
    return readFile(this.resolve(key))
  }

  async delete(keys: string[]) {
    const dirs = new Set<string>()
    for (const key of keys) {
      const file = this.resolve(key)
      dirs.add(path.dirname(file))
      await unlink(file).catch((err: NodeJS.ErrnoException) => {
        if (err.code !== 'ENOENT') throw err
      })
    }
    /* The upload's own folder, once empty. Anything left in it stays. */
    for (const dir of dirs) await rmdir(dir).catch(() => undefined)
  }
}
