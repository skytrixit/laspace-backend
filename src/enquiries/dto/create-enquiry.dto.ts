import { Transform } from 'class-transformer'
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'

/* ── Public enquiry ────────────────────────────────────────────────────────
   Exactly what the two website forms send. Anything else in the body is a
   422 (forbidNonWhitelisted), which is what keeps a visitor from setting
   `isHandled` on their own enquiry.
   ------------------------------------------------------------------------ */

const trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
/** Optional text fields arrive as '' from an untouched input; treat that as absent. */
const blankToUndefined = () =>
  Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))

/** The only sources a public form can claim. The rest are admin-entered. */
export const PUBLIC_SOURCES = ['website_form', 'consultation_modal'] as const

export class CreateEnquiryDto {
  @trim()
  @IsString()
  @MinLength(2, { message: 'Please tell us your name.' })
  @MaxLength(120)
  name!: string

  /* The site's own rule, unchanged: digits, spaces, +, (), -; at least 8. */
  @trim()
  @IsString()
  @Matches(/^[\d\s+()-]{8,}$/, { message: 'Enter a valid phone number.' })
  @MaxLength(32)
  phone!: string

  @blankToUndefined()
  @IsOptional()
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(190)
  email?: string

  @trim()
  @IsString()
  @MinLength(1, { message: 'Please choose a service.' })
  @MaxLength(120)
  service!: string

  @blankToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  budget?: string

  @blankToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string

  @IsIn([...PUBLIC_SOURCES])
  source!: (typeof PUBLIC_SOURCES)[number]

  /** Honeypot. Hidden from people; bots fill it. Any value = silent discard. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string

  /** When the form was rendered (ms since epoch). Submitting within 2s of it is not a person. */
  @IsOptional()
  @IsInt()
  formTs?: number
}
