/**
 * Seeds the database from the CLI (same data as the "Seed your database" button in /admin).
 * WARNING: wipes pages, posts, media, categories, forms and search first.
 *
 *   pnpm seed
 */
import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { seed } from '@/endpoints/seed'

const payload = await getPayload({ config })
const req = await createLocalReq({}, payload)
await seed({ payload, req })
process.exit(0)
