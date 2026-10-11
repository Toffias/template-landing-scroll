import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Page, Post } from '@/payload-types'

import { getServerSideURL } from './getURL'
import { getSiteSettings } from './getSiteSettings'
import { toMarkdown as md } from './lexicalToMarkdown'

/**
 * Builds /llms.txt (index) and /llms-full.txt (full content) from Payload.
 * Spec: https://llmstxt.org — H1 name, blockquote summary, then H2 link lists.
 */
export async function buildLlms({ full }: { full: boolean }): Promise<string> {
  const payload = await getPayload({ config: configPromise })
  const site = await getSiteSettings()
  const url = getServerSideURL()

  const [pages, posts] = await Promise.all([
    payload.find({
      collection: 'pages',
      draft: false,
      overrideAccess: false,
      pagination: false,
      limit: 500,
      depth: 0,
      where: { _status: { equals: 'published' } },
    }),
    payload.find({
      collection: 'posts',
      draft: false,
      overrideAccess: false,
      pagination: false,
      limit: 1000,
      depth: 1,
      sort: '-publishedAt',
      where: { _status: { equals: 'published' } },
    }),
  ])

  const pageUrl = (p: Page) => (p.slug === 'home' ? `${url}/` : `${url}/${p.slug}`)
  const postUrl = (p: Post) => `${url}/posts/${p.slug}`
  const oneLine = (s?: string | null) => (s || '').replace(/\s+/g, ' ').trim()

  const out: string[] = []
  out.push(`# ${site.siteName}`, '')
  out.push(`> ${oneLine(site.llmsSummary || site.description)}`, '')
  if (site.llmsDetails) out.push(site.llmsDetails.trim(), '')

  out.push('## Páginas', '')
  for (const p of pages.docs) {
    const desc = oneLine(p.meta?.description)
    out.push(`- [${p.title}](${pageUrl(p)})${desc ? `: ${desc}` : ''}`)
  }
  out.push('')

  if (posts.docs.length) {
    out.push('## Blog', '')
    for (const p of posts.docs) {
      const desc = oneLine(p.summary || p.meta?.description)
      out.push(`- [${p.title}](${postUrl(p)})${desc ? `: ${desc}` : ''}`)
    }
    out.push('')
  }

  if (!full) {
    out.push('## Optional', '')
    out.push(
      `- [Contenido completo](${url}/llms-full.txt): todas las páginas y artículos en Markdown`,
    )
    out.push(`- [Sitemap](${url}/sitemap.xml)`)
    return out.join('\n') + '\n'
  }

  // ---- full content ----
  out.push('---', '')
  for (const p of pages.docs) {
    out.push(`# ${p.title}`, '', `URL: ${pageUrl(p)}`, '')
    if (p.meta?.description) out.push(oneLine(p.meta.description), '')
    for (const block of p.layout || []) {
      if (block.blockType === 'scrollWorld') {
        for (const s of block.sections || []) {
          out.push(`## ${s.title}`, '')
          if (s.eyebrow) out.push(`*${s.eyebrow}*`, '')
          if (s.body) out.push(s.body, '')
          const tags = (s.tags || []).map((t) => t.tag).filter(Boolean)
          if (tags.length) out.push(tags.map((t) => `- ${t}`).join('\n'), '')
        }
      } else if (block.blockType === 'faq') {
        if (block.heading) out.push(`## ${block.heading}`, '')
        for (const q of block.items || []) out.push(`### ${q.question}`, '', q.answer, '')
      } else if (block.blockType === 'content') {
        for (const col of block.columns || []) {
          const text = md(col.richText)
          if (text) out.push(text, '')
        }
      } else if (block.blockType === 'cta') {
        const text = md(block.richText)
        if (text) out.push(text, '')
      }
    }
    out.push('---', '')
  }

  for (const p of posts.docs) {
    out.push(`# ${p.title}`, '', `URL: ${postUrl(p)}`)
    if (p.publishedAt) out.push(`Publicado: ${p.publishedAt.slice(0, 10)}`)
    out.push('')
    if (p.summary) out.push(`> ${oneLine(p.summary)}`, '')
    const body = md(p.content)
    if (body) out.push(body, '')
    if (p.faq?.length) {
      out.push('## Preguntas frecuentes', '')
      for (const q of p.faq) out.push(`### ${q.question}`, '', q.answer, '')
    }
    out.push('---', '')
  }

  return out.join('\n') + '\n'
}
