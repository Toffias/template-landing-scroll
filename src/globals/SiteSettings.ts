import type { GlobalConfig } from 'payload'

import { revalidateTag } from 'next/cache'

/**
 * Site-wide identity used by SEO + GEO: <title> template, Open Graph defaults,
 * Organization/WebSite JSON-LD, robots.txt AI-crawler policy and /llms.txt.
 * Fill this FIRST on every new project — entity consistency (same name, same
 * description, same sameAs links everywhere) is what lets AI engines recognise the brand.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings (SEO / GEO)',
  access: { read: () => true },
  admin: { group: 'Settings' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Identity',
          fields: [
            { name: 'siteName', type: 'text', required: true, defaultValue: 'Scroll World' },
            {
              name: 'tagline',
              type: 'text',
              admin: {
                description: 'One line: what it is + for whom. Reused in titles and llms.txt.',
              },
            },
            {
              name: 'description',
              type: 'textarea',
              required: true,
              defaultValue: 'Landing inmersiva con scroll cinematográfico, blog y SEO/GEO.',
              admin: {
                description:
                  'Default meta description (120–160 chars). Also the Organization description.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'locale',
                  type: 'text',
                  defaultValue: 'es',
                  admin: { width: '33%', description: 'BCP-47, e.g. es, es-AR, en.' },
                },
                {
                  name: 'titleSeparator',
                  type: 'text',
                  defaultValue: ' | ',
                  admin: { width: '33%' },
                },
                {
                  name: 'twitterHandle',
                  type: 'text',
                  admin: { width: '33%', description: '@handle (optional).' },
                },
              ],
            },
            { name: 'logo', type: 'upload', relationTo: 'media' },
            {
              name: 'defaultOgImage',
              type: 'upload',
              relationTo: 'media',
              admin: { description: '1200×630. Used when a page/post has no SEO image.' },
            },
          ],
        },
        {
          label: 'Organization',
          description: 'Feeds the Organization JSON-LD (knowledge-graph / AI entity signals).',
          fields: [
            {
              name: 'organizationType',
              type: 'select',
              defaultValue: 'Organization',
              options: [
                'Organization',
                'Corporation',
                'LocalBusiness',
                'ProfessionalService',
                'Store',
                'Restaurant',
                'EducationalOrganization',
                'NGO',
              ],
            },
            { name: 'legalName', type: 'text' },
            {
              type: 'row',
              fields: [
                { name: 'email', type: 'email', admin: { width: '50%' } },
                { name: 'phone', type: 'text', admin: { width: '50%' } },
              ],
            },
            {
              name: 'address',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'street', type: 'text', admin: { width: '50%' } },
                    { name: 'city', type: 'text', admin: { width: '50%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'region', type: 'text', admin: { width: '33%' } },
                    { name: 'postalCode', type: 'text', admin: { width: '33%' } },
                    {
                      name: 'country',
                      type: 'text',
                      admin: { width: '33%', description: 'ISO code, e.g. AR' },
                    },
                  ],
                },
              ],
            },
            {
              name: 'sameAs',
              type: 'array',
              admin: {
                description:
                  'Official profiles: LinkedIn, Instagram, YouTube, GitHub, Wikipedia/Wikidata, Google Business… Strongest GEO entity signal.',
              },
              fields: [{ name: 'url', type: 'text', required: true }],
            },
          ],
        },
        {
          label: 'GEO / AI',
          fields: [
            {
              name: 'allowAICrawlers',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description:
                  'Allow GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended… in robots.txt. Turn off only if the client explicitly opts out of AI search.',
              },
            },
            {
              name: 'llmsSummary',
              type: 'textarea',
              admin: {
                description:
                  'Blockquote summary at the top of /llms.txt. 2–4 factual sentences: who, what, where, for whom, differentiators.',
              },
            },
            {
              name: 'llmsDetails',
              type: 'textarea',
              admin: {
                description:
                  'Optional extra markdown for /llms.txt (key facts, pricing model, service area…).',
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      ({ doc, req: { context, payload } }) => {
        if (!context.disableRevalidate) {
          payload.logger.info('Revalidating site settings')
          revalidateTag('global_site-settings', 'max')
        }
        return doc
      },
    ],
  },
}
