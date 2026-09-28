import { UnprocessableEntityException, ValidationError } from '@nestjs/common'

/* ── Validation errors ─────────────────────────────────────────────────────
   The global ValidationPipe hands its errors here. The response is keyed by
   field so the admin forms can render each message beside its input:

     422 { code: 'validation_failed', fields: { email: 'must be an email' } }
   ------------------------------------------------------------------------ */

export type FieldErrors = Record<string, string>

export function flattenValidationErrors(errors: ValidationError[], prefix = ''): FieldErrors {
  const fields: FieldErrors = {}
  for (const error of errors) {
    const path = prefix ? `${prefix}.${error.property}` : error.property
    const first = Object.values(error.constraints ?? {})[0]
    if (first) fields[path] = first
    if (error.children?.length) Object.assign(fields, flattenValidationErrors(error.children, path))
  }
  return fields
}

export function validationExceptionFactory(errors: ValidationError[]) {
  return new UnprocessableEntityException({
    statusCode: 422,
    code: 'validation_failed',
    message: 'Some fields need attention.',
    fields: flattenValidationErrors(errors),
  })
}
