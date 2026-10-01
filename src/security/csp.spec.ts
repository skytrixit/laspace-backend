import { createHash } from 'node:crypto'
import { cspDirectives, inlineBlocks, sha256 } from './csp'

describe('content security policy', () => {
  it('allows scripts only from this origin, plus hashed inline blocks and Google when GA4 is on', () => {
    const off = cspDirectives({ production: false })
    expect(off['script-src']).toEqual(["'self'"])
    expect(off['connect-src']).toEqual(["'self'"])
    expect(off['upgrade-insecure-requests']).toBeUndefined()

    const on = cspDirectives({ production: true, ga4Id: 'G-X1', inlineScripts: ['gtag("js")'], cdnBaseUrl: 'https://cdn.example.com/path' })
    expect(on['script-src']).toEqual(["'self'", sha256('gtag("js")'), 'https://*.googletagmanager.com'])
    expect(on['img-src']).toEqual(expect.arrayContaining(['https://cdn.example.com', 'https://*.google-analytics.com']))
    expect(on['connect-src']).toContain('https://*.analytics.google.com')
    expect(on['upgrade-insecure-requests']).toEqual([])
    expect(on['frame-ancestors']).toEqual(["'none'"])
  })

  it('finds the inline blocks a document executes and ignores data blocks and external files', () => {
    const html = `<script src="/a.js"></script><script>run()</script><script type="application/ld+json">{"a":1}</script><script type="module">m()</script><style>body{}</style><link rel="stylesheet" href="x.css">`
    expect(inlineBlocks(html, 'script')).toEqual(['run()', 'm()'])
    expect(inlineBlocks(html, 'style')).toEqual(['body{}'])
  })

  it('writes hashes in the CSP source form', () => {
    const h = sha256('alert(1)')
    expect(h).toMatch(/^'sha256-[A-Za-z0-9+/]{43}='$/)
    expect(h).toBe(`'sha256-${createHash('sha256').update('alert(1)').digest('base64')}'`)
  })
})
