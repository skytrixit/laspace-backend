import { plainToInstance, Transform } from 'class-transformer'
import { IsBoolean, IsEmail, IsEnum, IsInt, IsOptional, IsString, IsUrl, Matches, Max, Min, MinLength, validateSync } from 'class-validator'

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
  DB_HOST = '127.0.0.1'

  @toInt() @IsInt() @Min(1) @Max(65535)
  DB_PORT = 3306

  @IsString() @MinLength(1)
  DB_NAME!: string

  @IsString() @MinLength(1)
  DB_USERNAME!: string

  @IsString()
  DB_PASSWORD!: string

  /* Optional second user for schema changes; falls back to DB_USERNAME. */
  @IsOptional() @IsString()
  DB_MIGRATE_USERNAME?: string

  @IsOptional() @IsString()
  DB_MIGRATE_PASSWORD?: string

  @toInt() @IsInt() @Min(1) @Max(365)
  SESSION_TTL_DAYS = 30

  /* Set true only behind a reverse proxy that sets X-Forwarded-For. */
  @IsOptional() @IsBoolean() @Transform(({ value }) => value === true || value === 'true' || value === '1')
  TRUST_PROXY = false

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

  /* AVIF encoding is CPU heavy and this process also serves pages: keep it low. */
  @toInt() @IsInt() @Min(1) @Max(4)
  MEDIA_WORKER_CONCURRENCY = 1

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

  /* ── Public site ─────────────────────────────────────────────────────── */
  /** The website's built output; the API serves its pages and assets. */
  @IsString()
  SITE_DIST = '../la_space_website/dist'

  /** Canonical origin for JSON-LD, sitemap and social meta. */
  @IsUrl({ require_tld: false })
  SITE_URL = 'https://www.laspaceinteriors.in'

  /** The admin panel's build, served at /admin with the SPA fallback. */
  @IsString()
  ADMIN_DIST = '../la_space_admin/dist'

  /* ── Tracking ────────────────────────────────────────────────────────── */
  /** GA4 measurement ID. Pages carry the gtag snippet only when this is set. */
  @IsOptional() @Matches(/^G-[A-Z0-9]{4,}$/)
  GA4_MEASUREMENT_ID?: string

  /** Search Console "HTML tag" verification token, rendered as a meta tag when set. */
  @IsOptional() @IsString()
  GOOGLE_SITE_VERIFICATION?: string
}

/** ConfigModule `validate` hook. Throws with every failure listed. */
export function validateEnv(raw: Record<string, unknown>): Env {
  /* A blank line in a .env file arrives as an empty string. Treat it as
     unset, so optional settings can be left blank in the template. */
  const present = Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== ''))
  const env = plainToInstance(Env, present, { enableImplicitConversion: false })
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
