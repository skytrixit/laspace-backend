import { Transform } from 'class-transformer'
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator'

const trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))

export class CreateFaqDto {
  @trim() @IsString() @MinLength(5) @MaxLength(255)
  question!: string

  @trim() @IsString() @MinLength(5) @MaxLength(5000)
  answer!: string

  @IsOptional() @IsBoolean()
  isPublished?: boolean

  @IsOptional() @IsInt() @Min(0)
  displayOrder?: number
}
