import { Transform } from 'class-transformer'
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator'

const trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
const blankToNull = () => Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value))

export class CreateTestimonialDto {
  @trim() @IsString() @MinLength(2) @MaxLength(120)
  customerName!: string

  /** Location or project reference. */
  @blankToNull() @IsOptional() @IsString() @MaxLength(160)
  attribution?: string | null

  @trim() @IsString() @MinLength(10, { message: 'A testimonial needs a few words.' }) @MaxLength(2000)
  quote!: string

  @IsOptional() @IsInt()
  photoId?: number | null

  @IsOptional() @IsBoolean()
  isPublished?: boolean

  @IsOptional() @IsInt() @Min(0)
  displayOrder?: number
}
