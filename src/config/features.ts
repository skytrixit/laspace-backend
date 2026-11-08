import type { ConfigService } from '@nestjs/config'
import type { Env } from './env'

/* ── Admin features ────────────────────────────────────────────────────────
   Sections of the admin panel that can be switched off from the
   environment — sold separately, released later by flipping the variable
   and restarting. Off means: the section's /api/admin endpoints answer 403
   `feature_locked`, and the panel, told through the login and /me
   responses, hides the section. The public site is never affected; it
   keeps reading the same rows through the public endpoints.
   ------------------------------------------------------------------------ */

export type Features = {
  /** The FAQ list — admin/faqs. */
  faqs: boolean
  /** Footer and contact details — admin/settings. */
  siteSettings: boolean
}

export type FeatureName = keyof Features

export const featuresOf = (config: ConfigService<Env, true>): Features => ({
  faqs: config.get('FEATURE_FAQS'),
  siteSettings: config.get('FEATURE_SITE_SETTINGS'),
})
