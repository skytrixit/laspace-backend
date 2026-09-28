import { ValidationError } from '@nestjs/common'
import { flattenValidationErrors, validationExceptionFactory } from './validation'

const err = (property: string, msg: string, children: ValidationError[] = []): ValidationError => ({
  property,
  constraints: { x: msg },
  children,
})

describe('validation errors', () => {
  it('keys the first message by field, flattening nested paths', () => {
    const fields = flattenValidationErrors([
      err('email', 'must be an email'),
      err('address', 'bad', [err('city', 'required')]),
    ])
    expect(fields).toEqual({ email: 'must be an email', address: 'bad', 'address.city': 'required' })
  })

  it('produces a 422 with a stable code', () => {
    const ex = validationExceptionFactory([err('phone', 'too short')])
    expect(ex.getStatus()).toBe(422)
    expect(ex.getResponse()).toMatchObject({ code: 'validation_failed', fields: { phone: 'too short' } })
  })
})
