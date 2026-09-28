import { Transform } from 'class-transformer'
import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, MaxLength, Min, MinLength } from 'class-validator'

const trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
const blankToNull = () => Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value))

export class CreateBrandDto {
  @trim() @IsString() @MinLength(1) @MaxLength(120)
  name!: string

  @blankToNull() @IsOptional() @IsUrl({ require_protocol: true }, { message: 'Enter the full address, starting with https://' }) @MaxLength(255)
  websiteUrl?: string | null

  @IsOptional() @IsInt()
  logoId?: number | null

  @IsOptional() @IsBoolean()
  isPublished?: boolean

  @IsOptional() @IsInt() @Min(0)
  displayOrder?: number
}
