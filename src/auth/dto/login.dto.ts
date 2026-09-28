import { Transform } from 'class-transformer'
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(190)
  email!: string

  @IsString()
  @MinLength(1, { message: 'Enter your password.' })
  @MaxLength(200)
  password!: string

  /** "Keep me signed in" — 30 days instead of a day. */
  @IsOptional()
  @IsBoolean()
  remember = false
}
