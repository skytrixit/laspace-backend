import { Transform, Type } from 'class-transformer'
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

export class ListProjectsDto {
  @IsOptional() @IsString() @MaxLength(40)
  category?: string

  @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean()
  featured?: boolean

  @Type(() => Number) @IsOptional() @IsInt() @Min(1) @Max(100)
  limit?: number
}
