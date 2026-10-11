import type { Block, Field, TextFieldSingleValidation } from 'payload'

const hex: TextFieldSingleValidation = (value) =>
  !value || /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value)) || 'Use a hex colour like #8a7bb5'

const videoUpload = (name: string, label: string, description: string): Field => ({
  name,
  type: 'upload',
  relationTo: 'media',
  label,
  filterOptions: { mimeType: { contains: 'video' } },
  admin: { description },
})

const imageUpload = (name: string, label: string, description: string): Field => ({
  name,
  type: 'upload',
  relationTo: 'media',
  label,
  filterOptions: { mimeType: { contains: 'image' } },
  admin: { description },
})

/**
 * Scroll-scrubbed "fly through the world" landing block.
 * Scroll drives the currentTime of pre-rendered camera clips (dive → connector → dive …).
 * The copy of every section is server-rendered, so it is indexable (SEO/GEO) even though
 * the visuals are video. See docs/scroll-world.md and .claude/skills/scroll-world.
 */
export const ScrollWorld: Block = {
  slug: 'scrollWorld',
  interfaceName: 'ScrollWorldBlock',
  labels: { singular: 'Scroll World', plural: 'Scroll Worlds' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Scenes',
          fields: [
            {
              name: 'sections',
              type: 'array',
              minRows: 1,
              required: true,
              admin: {
                description:
                  'Ordered scenes the camera flies through. 5–7 works well. The last one usually carries the CTA.',
                initCollapsed: true,
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'label',
                      type: 'text',
                      required: true,
                      admin: { width: '33%', description: 'Short name for the route rail.' },
                    },
                    {
                      name: 'anchor',
                      type: 'text',
                      admin: {
                        width: '33%',
                        description: 'Optional #anchor id (defaults to slugified label).',
                      },
                    },
                    {
                      name: 'accent',
                      type: 'text',
                      validate: hex,
                      admin: { width: '33%', description: 'Accent hex for this scene.' },
                    },
                  ],
                },
                { name: 'eyebrow', type: 'text' },
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                  admin: {
                    description: 'Rendered as an <h2> (the first section as the page <h1>).',
                  },
                },
                { name: 'body', type: 'textarea' },
                {
                  name: 'tags',
                  type: 'array',
                  maxRows: 3,
                  fields: [{ name: 'tag', type: 'text', required: true }],
                },
                {
                  type: 'collapsible',
                  label: 'Media',
                  fields: [
                    imageUpload(
                      'still',
                      'Poster still',
                      'First frame of the clip (poster, lazy-load and reduced-motion fallback).',
                    ),
                    videoUpload(
                      'clip',
                      'Dive clip (16:9)',
                      'Desktop master: native res, crf 20, GOP 8, no audio (pnpm world:encode).',
                    ),
                    imageUpload(
                      'stillMobile',
                      'Poster still (9:16)',
                      'Only for the opt-in mobile chain.',
                    ),
                    videoUpload(
                      'clipMobile',
                      'Dive clip (9:16)',
                      'Only for the opt-in mobile chain: 720w, GOP 4.',
                    ),
                  ],
                },
                {
                  type: 'collapsible',
                  label: 'Pacing',
                  admin: { initCollapsed: true },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'scroll',
                          type: 'number',
                          min: 0.3,
                          max: 6,
                          admin: {
                            width: '50%',
                            step: 0.1,
                            description:
                              'Viewport-heights of scroll for this scene (overrides the default). More = longer dwell.',
                          },
                        },
                        {
                          name: 'linger',
                          type: 'number',
                          min: 0,
                          max: 0.6,
                          admin: {
                            width: '50%',
                            step: 0.05,
                            description: '0–0.6. Camera settles mid-scene while the copy peaks.',
                          },
                        },
                      ],
                    },
                  ],
                },
                {
                  name: 'cta',
                  type: 'group',
                  admin: { description: 'Buttons (normally only on the last scene).' },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'primaryLabel', type: 'text', admin: { width: '50%' } },
                        { name: 'primaryHref', type: 'text', admin: { width: '50%' } },
                      ],
                    },
                    {
                      type: 'row',
                      fields: [
                        { name: 'secondaryLabel', type: 'text', admin: { width: '50%' } },
                        { name: 'secondaryHref', type: 'text', admin: { width: '50%' } },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Connectors',
          description:
            'Connector i joins scene i → i+1. Its endpoints must be the ACTUAL rendered frames of the neighbouring dives. Leave a slot empty to crossfade directly. Not used in walkthrough / locked-iso (architecture A).',
          fields: [
            {
              name: 'connectors',
              type: 'array',
              fields: [
                videoUpload('clip', 'Connector (16:9)', ''),
                videoUpload('clipMobile', 'Connector (9:16)', 'Mobile chain only.'),
              ],
            },
          ],
        },
        {
          label: 'Settings',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'diveScroll',
                  type: 'number',
                  defaultValue: 1.3,
                  admin: { width: '33%', step: 0.1, description: 'Viewport-heights per dive.' },
                },
                {
                  name: 'connScroll',
                  type: 'number',
                  defaultValue: 0.9,
                  admin: {
                    width: '33%',
                    step: 0.1,
                    description: 'Viewport-heights per connector.',
                  },
                },
                {
                  name: 'crossfade',
                  type: 'number',
                  defaultValue: 0.12,
                  admin: {
                    width: '33%',
                    step: 0.01,
                    description: 'Seam dissolve width (vh). Use ~0.08 for architecture A.',
                  },
                },
              ],
            },
            { name: 'hint', type: 'text', defaultValue: 'scroll' },
            {
              type: 'row',
              fields: [
                {
                  name: 'showRoute',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { width: '33%' },
                },
                {
                  name: 'showProgress',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { width: '33%' },
                },
                {
                  name: 'atmosphere',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { width: '33%' },
                },
              ],
            },
            {
              name: 'theme',
              type: 'group',
              admin: {
                description: 'Match `background` to the scene background so posters blend in.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'background', type: 'text', validate: hex, admin: { width: '25%' } },
                    { name: 'ink', type: 'text', validate: hex, admin: { width: '25%' } },
                    { name: 'inkSoft', type: 'text', validate: hex, admin: { width: '25%' } },
                    { name: 'accent', type: 'text', validate: hex, admin: { width: '25%' } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
