import { plainToInstance, Transform } from 'class-transformer'
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator'

/* ── Environment ───────────────────────────────────────────────────────────
   Every variable the API reads, validated once at boot. A bad or missing
   value stops the process with a readable list rather than surfacing later
   as a mysterious runtime error.
   ------------------------------------------------------------------------ */

export enum NodeEnv {
  development = 'development',
  test = 'test',
  production = 'production',
}

export enum MediaDriver {
  local = 'local',
  s3 = 's3',
}

const toInt = () => Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))

export class Env {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.development

  @toInt() @IsInt() @Min(1) @Max(65535)
  PORT = 4000

  @IsUrl({ require_tld: false })
  PUBLIC_ORIGIN!: string

  @IsUrl({ require_tld: false })
  ADMIN_ORIGIN!: string

  @IsString() @MinLength(1)
  DATABASE_URL!: string

  @IsOptional() @IsString()
  MIGRATE_DATABASE_URL?: string

  @toInt() @IsInt() @Min(1) @Max(365)
  SESSION_TTL_DAYS = 30

  @IsOptional() @IsString()
  SMTP_HOST?: string

  @IsOptional() @toInt() @IsInt()
  SMTP_PORT?: number

  @IsOptional() @IsString()
  SMTP_USER?: string

  @IsOptional() @IsString()
  SMTP_PASS?: string

  @IsOptional() @IsString()
  ALERT_FROM?: string

  @IsOptional() @IsEmail()
  ALERT_TO?: string

  @IsEnum(MediaDriver)
  MEDIA_DRIVER: MediaDriver = MediaDriver.local

  @IsString()
  MEDIA_LOCAL_PATH = './storage'

  @toInt() @IsInt() @Min(1) @Max(200)
  MEDIA_MAX_UPLOAD_MB = 40

  @IsOptional() @IsString()
  S3_ENDPOINT?: string

  @IsOptional() @IsString()
  S3_REGION?: string

  @IsOptional() @IsString()
  S3_BUCKET?: string

  @IsOptional() @IsString()
  S3_ACCESS_KEY?: string

  @IsOptional() @IsString()
  S3_SECRET_KEY?: string

  @IsOptional() @IsUrl({ require_tld: false })
  CDN_BASE_URL?: string
}

/** ConfigModule `validate` hook. Throws with every failure listed. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const env = plainToInstance(Env, raw, { enableImplicitConversion: false })
  const errors = validateSync(env, { skipMissingProperties: false, whitelist: true })
  if (errors.length > 0) {
    const lines = errors.map(
      (e) => `  ${e.property}: ${Object.values(e.constraints ?? {}).join('; ')}`,
    )
    throw new Error(`Invalid environment:\n${lines.join('\n')}`)
  }
  if (env.MEDIA_DRIVER === MediaDriver.s3) {
    const missing = ['S3_ENDPOINT', 'S3_BUCKET', 'S3_ACCESS_KEY', 'S3_SECRET_KEY', 'CDN_BASE_URL'].filter(
      (k) => !env[k as keyof Env],
    )
    if (missing.length) throw new Error(`MEDIA_DRIVER=s3 requires: ${missing.join(', ')}`)
  }
  return env
}
