import { SetMetadata } from '@nestjs/common'
import type { FeatureName } from '../../config/features'

export const FEATURE_KEY = 'feature'

/** Ties a controller (or one handler) to an admin feature flag — see config/features.ts. */
export const Feature = (name: FeatureName) => SetMetadata(FEATURE_KEY, name)
