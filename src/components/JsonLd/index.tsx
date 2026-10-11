import React from 'react'

/** Renders one or more schema.org objects as a JSON-LD <script>. Server component. */
export const JsonLd: React.FC<{ data: Record<string, unknown> | Record<string, unknown>[] }> = ({
  data,
}) => (
  <script
    type="application/ld+json"
    // `<` is escaped so user content can never close the script tag.
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
  />
)
