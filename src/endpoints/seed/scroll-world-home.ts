import type { RequiredDataFromCollectionSlug } from 'payload'

import type { Media } from '@/payload-types'

export type WorldMedia = {
  stills: Media[]
  clips: Media[]
  connectors: Media[]
}

/**
 * Demo home: a 3-scene scroll world (procedural clips from `pnpm world:demo`), followed by
 * a FAQ (FAQPage schema) and the latest posts. Replace the copy and media per project —
 * normally via `pnpm world:import world/<project>` rather than by hand.
 */
export const scrollWorldHome = ({
  stills,
  clips,
  connectors,
  metaImage,
}: WorldMedia & { metaImage?: Media }): RequiredDataFromCollectionSlug<'pages'> => ({
  slug: 'home',
  _status: 'published',
  title: 'Inicio',
  hero: { type: 'none' },
  layout: [
    {
      blockType: 'scrollWorld',
      diveScroll: 1.4,
      connScroll: 0.8,
      crossfade: 0.12,
      hint: 'scrolleá para entrar',
      showRoute: true,
      showProgress: true,
      atmosphere: true,
      theme: { background: '#0b0d1a', ink: '#f4f1ea', inkSoft: '#a9a6b8', accent: '#7c9cff' },
      sections: [
        {
          label: 'Origen',
          accent: '#7c9cff',
          eyebrow: 'Template · Scroll World',
          title: 'Una landing que se recorre como una película.',
          body: 'El scroll mueve una cámara pre-renderizada: entra en cada escena y vuela a la siguiente sin cortes. Estos clips son de demo; los tuyos se generan con IA.',
          tags: [{ tag: 'Next.js' }, { tag: 'Payload CMS' }, { tag: 'Higgsfield' }],
          still: stills[0].id,
          clip: clips[0].id,
          scroll: 1.6,
          linger: 0.35,
        },
        {
          label: 'Proceso',
          accent: '#ff9f6b',
          eyebrow: 'Pipeline',
          title: 'Imágenes, clips y costuras perfectas.',
          body: 'Una imagen por escena, un clip que entra en ella y conectores generados desde los fotogramas reales vecinos. La costura es idéntica, frame a frame.',
          tags: [{ tag: 'GPT Image 2' }, { tag: 'Seedance 2.0' }, { tag: 'ffmpeg' }],
          still: stills[1].id,
          clip: clips[1].id,
        },
        {
          label: 'Producto',
          accent: '#e48bff',
          eyebrow: 'Listo para publicar',
          title: 'Contenido editable, SEO y GEO desde el día uno.',
          body: 'Todo el texto vive en Payload y se renderiza en el servidor: indexable por Google y citable por ChatGPT, Perplexity, Claude y Gemini.',
          tags: [{ tag: 'JSON-LD' }, { tag: 'llms.txt' }, { tag: 'Blog' }],
          still: stills[2].id,
          clip: clips[2].id,
          scroll: 1.6,
          linger: 0.3,
          cta: {
            primaryLabel: 'Leer el blog',
            primaryHref: '/posts',
            secondaryLabel: 'Abrir el admin',
            secondaryHref: '/admin',
          },
        },
      ],
      connectors: connectors.map((c) => ({ clip: c.id })),
    },
    {
      blockType: 'faq',
      heading: 'Preguntas frecuentes',
      emitSchema: true,
      items: [
        {
          question: '¿Cómo funciona una landing con scroll cinematográfico?',
          answer:
            'La página reproduce videos pre-renderizados y el scroll controla el tiempo de cada clip. Cada escena tiene un clip que entra en ella y un conector que vuela hasta la siguiente. Como los extremos de los conectores son los fotogramas reales de los clips vecinos, no se ven cortes.',
        },
        {
          question: '¿Con qué herramientas se generan las escenas?',
          answer:
            'Las imágenes fijas se generan con GPT Image 2 vía Higgsfield y los clips de cámara con Seedance 2.0 (Monid o Higgsfield), usando imagen inicial y final para fijar las costuras. ffmpeg extrae fotogramas y codifica los videos para un scrub fluido.',
        },
        {
          question: '¿El contenido de la landing es indexable por buscadores e IA?',
          answer:
            'Sí. Los títulos y textos de cada escena se editan en Payload CMS y se renderizan en HTML del lado del servidor. El sitio además publica datos estructurados JSON-LD, un sitemap, robots.txt con crawlers de IA habilitados y /llms.txt.',
        },
      ],
    },
    {
      blockType: 'archive',
      introContent: {
        root: {
          type: 'root',
          children: [
            {
              type: 'heading',
              children: [
                {
                  type: 'text',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Últimos artículos',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              tag: 'h2',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      },
      populateBy: 'collection',
      relationTo: 'posts',
      limit: 3,
    },
  ],
  meta: {
    title: 'Scroll World — landing inmersiva con Payload CMS',
    description:
      'Template de landing con scroll cinematográfico generado con IA, Payload CMS, blog y SEO/GEO listo: JSON-LD, sitemap, robots para crawlers de IA y llms.txt.',
    image: metaImage?.id,
  },
})
