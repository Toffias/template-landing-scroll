import React from 'react'

import type { FAQBlock as FAQBlockProps } from '@/payload-types'

import { JsonLd } from '@/components/JsonLd'
import { faqSchema } from '@/utilities/structuredData'

export const FAQBlock: React.FC<FAQBlockProps> = ({ heading, intro, items, emitSchema }) => {
  if (!items?.length) return null

  return (
    <section className="container max-w-[48rem]" aria-labelledby="faq-heading">
      {heading && (
        <h2 id="faq-heading" className="text-3xl font-semibold tracking-tight mb-4">
          {heading}
        </h2>
      )}
      {intro && <p className="text-muted-foreground mb-8">{intro}</p>}
      <div className="divide-y divide-border border-y border-border">
        {items.map((item, i) => (
          <details key={item.id || i} className="group py-5" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
              <h3 className="m-0 text-lg font-medium">{item.question}</h3>
              <span
                aria-hidden
                className="transition-transform group-open:rotate-45 text-2xl leading-none"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-muted-foreground leading-relaxed">{item.answer}</p>
          </details>
        ))}
      </div>
      {emitSchema !== false && <JsonLd data={faqSchema(items)} />}
    </section>
  )
}
