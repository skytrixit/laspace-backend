import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

export const HANDLED_FILTERS = ['all', 'unhandled', 'handled'] as const

export class ListEnquiriesDto {
  @Type(() => Number) @IsOptional() @IsInt() @Min(1)
  page = 1

  @Type(() => Number) @IsOptional() @IsInt() @Min(1) @Max(100)
  pageSize = 25

  @IsOptional() @IsString() @MaxLength(100)
  q?: string

  @IsOptional() @IsIn([...HANDLED_FILTERS])
  handled: (typeof HANDLED_FILTERS)[number] = 'all'
}
