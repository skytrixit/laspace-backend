import { Transform } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'
import { SLUG_PATTERN } from '../../common/slug'

const trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
const blankToNull = () => Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value))

export class CreateServiceDto {
  @trim() @IsString() @MinLength(2) @MaxLength(120)
  name!: string

  /** Omit to derive from the name. */
  @IsOptional() @IsString() @Matches(SLUG_PATTERN, { message: 'Lower-case letters, numbers and hyphens only.' }) @MaxLength(120)
  slug?: string

  @trim() @IsString() @MinLength(1, { message: 'Add a short description.' }) @MaxLength(500)
  shortDescription!: string

  @blankToNull() @IsOptional() @IsString() @MaxLength(20000)
  fullDescription?: string | null

  @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @MaxLength(200, { each: true })
  inclusions: string[] = []

  @IsOptional() @IsInt()
  imageId?: number | null

  @IsOptional() @IsBoolean()
  isPublished?: boolean

  @IsOptional() @IsInt() @Min(0)
  displayOrder?: number
}
