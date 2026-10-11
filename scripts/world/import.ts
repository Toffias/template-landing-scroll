/**
 * Uploads an encoded world (world/<project>/dist/manifest.json, produced by
 * `pnpm world:encode`) into Payload Media and writes it into a page's ScrollWorld block.
 *
 *   pnpm world:import world/<project>           # saves as DRAFT (review in /admin)
 *   pnpm world:import world/<project> publish   # publishes directly
 *
 * (`payload run` swallows --flags, hence the positional `publish`.)
 *
 * - Page slug comes from world.json `page.slug` (default "home").
 * - If the page exists, its first ScrollWorld block is replaced (other blocks are kept);
 *   otherwise a page is created with [ScrollWorld, FAQ?] and the SEO fields from world.json.
 */
import type { File, Payload } from 'payload'

import config from '@payload-config'
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'

type ManifestSection = {
  id?: string
  label: string
  accent?: string
  eyebrow?: string
  title: string
  body?: string
  tags?: string[]
  alt?: string
  still?: string | null
  stillMobile?: string | null
  clip?: string | null
  clipMobile?: string | null
  scroll?: number
  linger?: number
  cta?: {
    primary?: { label: string; href: string }
    secondary?: { label: string; href: string }
  }
}

type Manifest = {
  brand?: { name?: string }
  camera?: 'fly-through' | 'walkthrough' | 'locked-iso'
  page?: { slug?: string; title?: string }
  settings?: {
    diveScroll?: number
    connScroll?: number
    crossfade?: number
    hint?: string
    theme?: { background?: string; ink?: string; inkSoft?: string; accent?: string }
  }
  sections: ManifestSection[]
  connectors: (string | null)[]
  connectorsMobile: (string | null)[]
  faq?: { question: string; answer: string }[]
  seo?: { title?: string; description?: string }
}

const MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
}

async function upload(payload: Payload, dir: string, rel: string | null | undefined, alt: string) {
  if (!rel) return undefined
  const full = path.join(dir, rel)
  if (!fs.existsSync(full)) {
    payload.logger.warn(`  missing ${rel} — slot left empty`)
    return undefined
  }
  const data = fs.readFileSync(full)
  const file: File = {
    name: path.basename(full),
    data,
    mimetype: MIME[path.extname(full).toLowerCase()] || 'application/octet-stream',
    size: data.byteLength,
  }
  const doc = await payload.create({ collection: 'media', data: { alt }, file })
  payload.logger.info(`  ↑ ${rel} → media #${doc.id}`)
  return doc.id
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.endsWith('import.ts'))
  const dir = args.find((a) => a !== 'publish' && !a.startsWith('--'))
  const publish = args.includes('publish') || process.env.WORLD_PUBLISH === '1'
  if (!dir) throw new Error('Usage: pnpm world:import world/<project> [publish]')

  const manifestPath = path.resolve(dir, 'dist/manifest.json')
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`${manifestPath} not found — run pnpm world:encode ${dir} first.`)
  }
  const root = path.resolve(dir)
  const m: Manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const payload = await getPayload({ config })
  const brand = m.brand?.name || 'Scroll World'

  payload.logger.info(`Importing ${m.sections.length} scenes from ${dir}`)
  const sections = []
  for (const s of m.sections) {
    const alt = s.alt || `${brand} — ${s.label}`
    sections.push({
      label: s.label,
      anchor: s.id,
      accent: s.accent,
      eyebrow: s.eyebrow,
      title: s.title,
      body: s.body,
      tags: (s.tags || []).map((tag) => ({ tag })),
      still: await upload(payload, root, s.still, alt),
      clip: await upload(payload, root, s.clip, ''),
      stillMobile: await upload(payload, root, s.stillMobile, alt),
      clipMobile: await upload(payload, root, s.clipMobile, ''),
      scroll: s.scroll,
      linger: s.linger,
      cta: s.cta
        ? {
            primaryLabel: s.cta.primary?.label,
            primaryHref: s.cta.primary?.href,
            secondaryLabel: s.cta.secondary?.label,
            secondaryHref: s.cta.secondary?.href,
          }
        : undefined,
    })
  }

  const archA = m.camera === 'walkthrough' || m.camera === 'locked-iso'
  const connectors = []
  if (!archA) {
    for (let i = 0; i < m.sections.length - 1; i++) {
      connectors.push({
        clip: await upload(payload, root, m.connectors?.[i], ''),
        clipMobile: await upload(payload, root, m.connectorsMobile?.[i], ''),
      })
    }
  }

  const st = m.settings || {}
  const block = {
    blockType: 'scrollWorld' as const,
    diveScroll: st.diveScroll ?? 1.3,
    connScroll: st.connScroll ?? 0.9,
    crossfade: st.crossfade ?? (archA ? 0.08 : 0.12),
    hint: st.hint || 'scroll',
    showRoute: true,
    showProgress: true,
    atmosphere: true,
    theme: st.theme || {},
    sections,
    connectors,
  }

  const slug = m.page?.slug || 'home'
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
    draft: true,
    depth: 0,
  })
  const status = publish ? 'published' : 'draft'

  if (existing.docs[0]) {
    const page = existing.docs[0]
    const layout = [...(page.layout || [])]
    const at = layout.findIndex((b) => b.blockType === 'scrollWorld')
    if (at >= 0) layout[at] = block as never
    else layout.unshift(block as never)
    await payload.update({
      collection: 'pages',
      id: page.id,
      draft: !publish,
      // Running outside Next.js: revalidatePath is unavailable. The page revalidates
      // on its next save from /admin, or immediately in dev.
      context: { disableRevalidate: true },
      data: { layout, hero: { type: 'none' }, _status: status },
    })
    payload.logger.info(`Updated page "${slug}" (#${page.id}) as ${status}.`)
  } else {
    const layout: unknown[] = [block]
    if (m.faq?.length)
      layout.push({ blockType: 'faq', heading: 'Preguntas frecuentes', items: m.faq })
    const doc = await payload.create({
      collection: 'pages',
      draft: !publish,
      context: { disableRevalidate: true },
      data: {
        title: m.page?.title || brand,
        slug,
        hero: { type: 'none' },
        layout: layout as never,
        meta: { title: m.seo?.title, description: m.seo?.description },
        _status: status,
      },
    })
    payload.logger.info(`Created page "${slug}" (#${doc.id}) as ${status}.`)
  }
  payload.logger.info(
    `Open ${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/admin/collections/pages to review.`,
  )
  process.exit(0)
}

// Top-level await: `payload run` exits as soon as the module finishes evaluating.
try {
  await main()
} catch (err) {
  console.error(err)
  process.exit(1)
}
