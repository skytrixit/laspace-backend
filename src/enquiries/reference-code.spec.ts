import { REFERENCE_PATTERN, referenceCode } from './reference-code'

describe('referenceCode', () => {
  it('is LA + 8 unambiguous characters', () => {
    for (let i = 0; i < 200; i++) expect(referenceCode()).toMatch(REFERENCE_PATTERN)
  })

  it('never contains 0, O, 1 or I', () => {
    const joined = Array.from({ length: 200 }, referenceCode).join('')
    expect(joined).not.toMatch(/[0O1I]/)
  })
})
