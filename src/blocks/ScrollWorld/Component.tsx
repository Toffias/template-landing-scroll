import React from 'react'

import type { Media, ScrollWorldBlock as ScrollWorldBlockProps } from '@/payload-types'

import { getMediaUrl } from '@/utilities/getMediaUrl'

import { ScrollWorldClient, type WorldConfig } from './Component.client'

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const url = (m?: number | Media | null) =>
  m && typeof m === 'object' && m.url ? getMediaUrl(m.url, m.updatedAt) : undefined

/**
 * Server half: resolves Payload uploads to URLs and hands a plain config to the client
 * engine. All copy is rendered as HTML by the client component's SSR pass, so crawlers
 * and AI engines read every scene's headline/body even though visuals are video.
 */
export const ScrollWorldBlock: React.FC<ScrollWorldBlockProps & { primary?: boolean }> = (
  props,
) => {
  const { sections = [], connectors, theme, primary } = props
  if (!sections?.length) return null

  const config: WorldConfig = {
    diveScroll: props.diveScroll ?? 1.3,
    connScroll: props.connScroll ?? 0.9,
    crossfade: props.crossfade ?? 0.12,
    hint: props.hint || 'scroll',
    showRoute: props.showRoute !== false,
    showProgress: props.showProgress !== false,
    atmosphere: props.atmosphere !== false,
    theme: {
      bg: theme?.background || undefined,
      ink: theme?.ink || undefined,
      inkSoft: theme?.inkSoft || undefined,
      accent: theme?.accent || undefined,
    },
    sections: sections.map((s, i) => ({
      id: s.anchor || slugify(s.label || `scene-${i + 1}`),
      label: s.label,
      accent: s.accent || undefined,
      eyebrow: s.eyebrow || undefined,
      title: s.title,
      body: s.body || undefined,
      tags: (s.tags || []).map((t) => t.tag).filter(Boolean),
      still: url(s.still),
      stillMobile: url(s.stillMobile),
      clip: url(s.clip),
      clipMobile: url(s.clipMobile),
      scroll: s.scroll || undefined,
      linger: s.linger || undefined,
      cta:
        s.cta?.primaryLabel || s.cta?.secondaryLabel
          ? {
              primary: s.cta.primaryLabel
                ? { label: s.cta.primaryLabel, href: s.cta.primaryHref || '#' }
                : undefined,
              secondary: s.cta.secondaryLabel
                ? { label: s.cta.secondaryLabel, href: s.cta.secondaryHref || '#' }
                : undefined,
            }
          : undefined,
    })),
    connectors: (connectors || []).map((c) => url(c.clip) || null),
    connectorsMobile: (connectors || []).map((c) => url(c.clipMobile) || null),
  }

  return <ScrollWorldClient config={config} primary={Boolean(primary)} />
}
