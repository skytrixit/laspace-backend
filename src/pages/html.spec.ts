import { injectHead, scriptJson, summary, trackingHead } from './html'

describe('page html helpers', () => {
  it('writes JSON that cannot break out of a script element', () => {
    const out = scriptJson({ text: '</script><script>alert(1)</script>', sep: '  ' })
    expect(out).not.toContain('</script>')
    expect(out).not.toContain(' ')
    expect(JSON.parse(out)).toEqual({ text: '</script><script>alert(1)</script>', sep: '  ' })
  })

  it('injects the data block, graphs and extra tags before </head> and fills tokens escaped', () => {
    const html = injectHead('<html><head><title>__T__</title></head><body></body></html>', { a: 1 }, [{ '@type': 'Thing' }], { T: 'A & B <c>' }, ['<meta name="x" content="y">'])
    expect(html).toContain('<title>A &amp; B &lt;c&gt;</title>')
    expect(html.indexOf('id="__DATA__"')).toBeLessThan(html.indexOf('</head>'))
    expect(html).toContain('<script type="application/ld+json">{"@type":"Thing"}</script>')
    expect(html).toContain('<meta name="x" content="y">')
  })

  it('renders no tracking tags until the IDs are configured', () => {
    expect(trackingHead({})).toEqual([])
    const tags = trackingHead({ ga4Id: 'G-TEST1234', siteVerification: 'abc"def' })
    expect(tags[0]).toBe('<meta name="google-site-verification" content="abc&quot;def">')
    expect(tags.join('\n')).toContain('https://www.googletagmanager.com/gtag/js?id=G-TEST1234')
    expect(tags.join('\n')).toContain("gtag('config','G-TEST1234')")
    // never a script the browser fetches at head time: the tag is appended after load
    expect(tags.some((t) => /<script[^>]*\ssrc=/.test(t))).toBe(false)
    expect(tags.join('\n')).toContain("addEventListener('load'")
  })

  it('cuts a description at a word boundary', () => {
    expect(summary('Short one.')).toBe('Short one.')
    const long = summary('word '.repeat(60))
    expect(long.length).toBeLessThanOrEqual(161)
    expect(long.endsWith('…')).toBe(true)
  })
})
