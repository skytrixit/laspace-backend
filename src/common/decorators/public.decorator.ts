import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'

/** Marks an admin-prefixed route as reachable without a session (login only). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
