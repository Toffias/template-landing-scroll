import type { MetadataRoute } from 'next'

import { getServerSideURL } from '@/utilities/getURL'
import { getSiteSettings } from '@/utilities/getSiteSettings'

/**
 * AI crawlers, grouped by purpose. Search/answer bots are what make a site citable in
 * ChatGPT search, Perplexity, Claude, Copilot and AI Overviews; training bots only feed
 * model training. Site Settings → GEO / AI → "Allow AI crawlers" toggles them all.
 */
const AI_SEARCH_BOTS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'DuckAssistBot',
]
const AI_TRAINING_BOTS = [
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'meta-externalagent',
  'Amazonbot',
]

// Re-read Site Settings hourly (the AI-crawler toggle lives there).
export const revalidate = 3600

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSiteSettings().catch(() => null)
  const allowAI = site?.allowAICrawlers !== false
  const url = getServerSideURL()
  const privatePaths = ['/admin', '/api/', '/next/', '/search']

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: privatePaths },
      {
        userAgent: [...AI_SEARCH_BOTS, ...AI_TRAINING_BOTS],
        ...(allowAI ? { allow: '/', disallow: privatePaths } : { disallow: '/' }),
      },
    ],
    sitemap: [`${url}/sitemap.xml`],
    host: url,
  }
}
