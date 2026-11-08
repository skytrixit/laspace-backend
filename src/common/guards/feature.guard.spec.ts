import { ExecutionContext } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import type { Env } from '../../config/env'
import { FEATURE_KEY } from '../decorators/feature.decorator'
import { FeatureGuard } from './feature.guard'

const ctx = { getHandler: () => 'handler', getClass: () => 'class' } as unknown as ExecutionContext

const guard = (flags: Record<string, boolean>, marked?: string) => {
  const reflector = { getAllAndOverride: jest.fn((key: string) => (key === FEATURE_KEY ? marked : undefined)) }
  const config = { get: jest.fn((key: string) => flags[key]) }
  return new FeatureGuard(reflector as unknown as Reflector, config as unknown as ConfigService<Env, true>)
}

describe('FeatureGuard', () => {
  const on = { FEATURE_FAQS: true, FEATURE_SITE_SETTINGS: true }
  const off = { FEATURE_FAQS: false, FEATURE_SITE_SETTINGS: false }

  it('ignores routes that carry no feature mark', () => {
    expect(guard(off).canActivate(ctx)).toBe(true)
  })

  it('passes a marked route while its flag is on', () => {
    expect(guard(on, 'faqs').canActivate(ctx)).toBe(true)
    expect(guard(on, 'siteSettings').canActivate(ctx)).toBe(true)
  })

  it('answers 403 feature_locked once the flag is off', () => {
    for (const name of ['faqs', 'siteSettings']) {
      let thrown: unknown
      try {
        guard(off, name).canActivate(ctx)
      } catch (e) {
        thrown = e
      }
      expect(thrown).toMatchObject({ response: { statusCode: 403, code: 'feature_locked' } })
    }
  })

  it('locks only the section whose flag is off', () => {
    const faqsOnly = { FEATURE_FAQS: true, FEATURE_SITE_SETTINGS: false }
    expect(guard(faqsOnly, 'faqs').canActivate(ctx)).toBe(true)
    expect(() => guard(faqsOnly, 'siteSettings').canActivate(ctx)).toThrow()
  })
})
