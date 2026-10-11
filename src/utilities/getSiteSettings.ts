import type { SiteSetting } from '@/payload-types'

import { getCachedGlobal } from './getGlobals'

/** Cached Site Settings (revalidated by the global's afterChange hook). */
export const getSiteSettings = async (): Promise<SiteSetting> =>
  (await getCachedGlobal('site-settings', 1)()) as SiteSetting
