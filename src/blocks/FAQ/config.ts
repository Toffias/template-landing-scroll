import type { Block } from 'payload'

/**
 * FAQ block. Renders semantic Q&A + FAQPage JSON-LD.
 * GEO: question-shaped headings with short, self-contained answers (40–80 words) are
 * the passages AI engines quote most often. Write answers that make sense out of context.
 */
export const FAQ: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Preguntas frecuentes' },
    { name: 'intro', type: 'textarea' },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      required: true,
      fields: [
        { name: 'question', type: 'text', required: true },
        {
          name: 'answer',
          type: 'textarea',
          required: true,
          admin: { description: 'Plain text, 40–80 words, answer first then context.' },
        },
      ],
    },
    {
      name: 'emitSchema',
      type: 'checkbox',
      defaultValue: true,
      label: 'Emit FAQPage structured data',
    },
  ],
}
