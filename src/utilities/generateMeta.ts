import type { Metadata } from 'next'

import type { Page, Post } from '../payload-types'

import { getServerSideURL } from './getURL'
import { getSiteSettings } from './getSiteSettings'
import { mergeOpenGraph } from './mergeOpenGraph'
import { mediaUrl } from './structuredData'

/**
 * Per-document metadata: title template from Site Settings, canonical URL,
 * Open Graph / Twitter, falling back to the site defaults.
 */
export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
  /** Public path of the document, e.g. `/`, `/about`, `/posts/my-post`. */
  path?: string
}): Promise<Metadata> => {
  const { doc, path } = args
  const site = await getSiteSettings()
  const siteName = site.siteName || 'Scroll World'
  const sep = site.titleSeparator || ' | '

  const docTitle = doc?.meta?.title || doc?.title
  const isHome = path === '/' || doc?.slug === 'home'
  const title = docTitle && !isHome ? `${docTitle}${sep}${siteName}` : docTitle || siteName
  const description = doc?.meta?.description || site.description || undefined
  const image =
    mediaUrl(doc?.meta?.image) ||
    mediaUrl(site.defaultOgImage) ||
    `${getServerSideURL()}/website-template-OG.webp`
  const canonical = path ?? (doc?.slug && doc.slug !== 'home' ? `/${doc.slug}` : '/')

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: mergeOpenGraph({
      title,
      description: description || '',
      siteName,
      locale: site.locale || 'es',
      images: [{ url: image, width: 1200, height: 630 }],
      url: canonical,
    }),
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: site.twitterHandle || undefined,
    },
  }
}
