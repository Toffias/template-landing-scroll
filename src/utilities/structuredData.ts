import type { Media, Post, SiteSetting } from '@/payload-types'

import { getServerSideURL } from './getURL'

type Thing = Record<string, unknown>

const abs = (path?: string | null) => {
  if (!path) return undefined
  return path.startsWith('http') ? path : `${getServerSideURL()}${path}`
}

export const mediaUrl = (m?: number | Media | null) =>
  m && typeof m === 'object' ? abs(m.sizes?.og?.url || m.url) : undefined

const orgId = () => `${getServerSideURL()}/#organization`
const siteId = () => `${getServerSideURL()}/#website`

export function organizationSchema(s: SiteSetting): Thing {
  const a = s.address
  const hasAddress = a && (a.street || a.city || a.country)
  return {
    '@context': 'https://schema.org',
    '@type': s.organizationType || 'Organization',
    '@id': orgId(),
    name: s.siteName,
    legalName: s.legalName || undefined,
    description: s.description,
    url: getServerSideURL(),
    logo: mediaUrl(s.logo),
    email: s.email || undefined,
    telephone: s.phone || undefined,
    address: hasAddress
      ? {
          '@type': 'PostalAddress',
          streetAddress: a?.street || undefined,
          addressLocality: a?.city || undefined,
          addressRegion: a?.region || undefined,
          postalCode: a?.postalCode || undefined,
          addressCountry: a?.country || undefined,
        }
      : undefined,
    sameAs: (s.sameAs || []).map((x) => x.url).filter(Boolean),
  }
}

export function websiteSchema(s: SiteSetting): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': siteId(),
    url: getServerSideURL(),
    name: s.siteName,
    description: s.description,
    inLanguage: s.locale || 'es',
    publisher: { '@id': orgId() },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${getServerSideURL()}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function articleSchema(post: Post, s: SiteSetting): Thing {
  const url = `${getServerSideURL()}/posts/${post.slug}`
  const authors = (post.populatedAuthors || []).filter((a) => a?.name)
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: url,
    url,
    headline: post.title,
    description: post.meta?.description || post.summary || undefined,
    abstract: post.summary || undefined,
    image: mediaUrl(post.meta?.image) || mediaUrl(post.heroImage),
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    inLanguage: s.locale || 'es',
    author: authors.length
      ? authors.map((a) => ({ '@type': 'Person', name: a.name }))
      : { '@id': orgId() },
    publisher: { '@id': orgId() },
    isPartOf: { '@id': siteId() },
    keywords:
      (post.categories || [])
        .map((c) => (typeof c === 'object' ? c.title : null))
        .filter(Boolean)
        .join(', ') || undefined,
  }
}

export function breadcrumbSchema(items: { name: string; path: string }[]): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${getServerSideURL()}${it.path}`,
    })),
  }
}

export function faqSchema(items: { question: string; answer: string }[]): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  }
}
