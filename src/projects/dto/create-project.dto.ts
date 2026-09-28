import { Transform } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
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

export class CreateProjectDto {
  @trim() @IsString() @MinLength(2) @MaxLength(160)
  title!: string

  @IsOptional() @IsString() @Matches(SLUG_PATTERN, { message: 'Lower-case letters, numbers and hyphens only.' }) @MaxLength(120)
  slug?: string

  /** Filter tags — a kitchen project is usually Kitchen and Residential. */
  @IsArray() @ArrayMinSize(1, { message: 'Choose at least one category.' }) @ArrayMaxSize(6) @IsString({ each: true }) @MaxLength(40, { each: true })
  categories!: string[]

  /** The label on the card: "Modular Kitchen", "Walk-in Closet". */
  @blankToNull() @IsOptional() @IsString() @MaxLength(60)
  typeLabel?: string | null

  @trim() @IsString() @MinLength(1) @MaxLength(120)
  location!: string

  @blankToNull() @IsOptional() @IsString() @MaxLength(60)
  areaLabel?: string | null

  @blankToNull() @IsOptional() @IsString() @MaxLength(10)
  yearLabel?: string | null

  @trim() @IsString() @MinLength(1, { message: 'Add a short description.' }) @MaxLength(500)
  shortDescription!: string

  @blankToNull() @IsOptional() @IsString() @MaxLength(20000)
  fullDescription?: string | null

  @IsOptional() @IsInt()
  coverId?: number | null

  @IsOptional() @IsBoolean()
  isFeatured?: boolean

  @IsOptional() @IsBoolean()
  isPublished?: boolean

  @IsOptional() @IsInt() @Min(0)
  displayOrder?: number
}
