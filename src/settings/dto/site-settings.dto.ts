import { Transform } from 'class-transformer'
import { IsEmail, IsInt, IsOptional, IsString, IsUrl, Matches, MaxLength, Min, MinLength } from 'class-validator'

const trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
const blankToNull = () => Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value))
const url = () => IsUrl({ require_protocol: true }, { message: 'Enter the full address, starting with https://' })

/** The whole settings row, every time — one form, one save. */
export class SiteSettingsDto {
  @trim() @IsString() @MinLength(6) @MaxLength(32)
  phone!: string

  @trim() @IsString() @Matches(/^tel:\+?[\d]+$/, { message: 'Use the form tel:+919000000000' }) @MaxLength(40)
  phoneHref!: string

  @trim() @IsString() @url() @MaxLength(255)
  whatsappHref!: string

  @trim() @IsEmail() @MaxLength(190)
  email!: string

  @trim() @IsString() @MinLength(1) @MaxLength(160)
  addressLine1!: string

  @blankToNull() @IsOptional() @IsString() @MaxLength(160)
  addressLine2?: string | null

  @blankToNull() @IsOptional() @IsString() @MaxLength(160)
  addressLine3?: string | null

  @trim() @IsString() @MinLength(1) @MaxLength(120)
  hours!: string

  @blankToNull() @IsOptional() @url() @MaxLength(500)
  mapsUrl?: string | null

  @blankToNull() @IsOptional() @url() @MaxLength(255)
  instagramUrl?: string | null

  @blankToNull() @IsOptional() @url() @MaxLength(255)
  facebookUrl?: string | null

  @blankToNull() @IsOptional() @url() @MaxLength(255)
  youtubeUrl?: string | null

  @IsInt() @Min(0)
  statProjects!: number

  @IsInt() @Min(0)
  statFamilies!: number

  @IsInt() @Min(0)
  statConcepts!: number

  @IsInt() @Min(0)
  statYears!: number
}
