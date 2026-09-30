import { Transform } from 'class-transformer'
import { IsOptional, IsString, MaxLength } from 'class-validator'

export class UploadMediaDto {
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsOptional() @IsString() @MaxLength(255)
  alt?: string
}

export class UpdateMediaDto {
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value))
  @IsOptional() @IsString() @MaxLength(255)
  altText?: string | null
}
