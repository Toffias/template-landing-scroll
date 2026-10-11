import type { RequiredDataFromCollectionSlug } from 'payload'

type PostData = RequiredDataFromCollectionSlug<'posts'>

/**
 * GEO fields for the demo posts: an answer-first summary (TL;DR) and a short FAQ.
 * They show the pattern every real post should follow (see docs/seo-geo.md).
 */
const geo: Record<string, Pick<PostData, 'summary' | 'faq'>> = {
  '1': {
    summary:
      'Digital Horizons is a demo article about emerging technology. It shows how a post combines a TL;DR, headings, a callout block and a FAQ so that search engines and AI assistants can quote it accurately.',
    faq: [
      {
        question: 'What is this demo post for?',
        answer:
          'It illustrates the post structure the template expects: a short answer-first summary, scannable sections and a FAQ, all emitted as BlogPosting and FAQPage structured data.',
      },
    ],
  },
  '2': {
    summary:
      'Global Gaze is a demo article about global news coverage. Replace it with real content that answers one specific question your audience asks.',
    faq: [
      {
        question: 'How should a real post replace this one?',
        answer:
          'Pick one question your customers ask, answer it in the first two sentences, support it with data or first-hand experience, and cite your sources.',
      },
    ],
  },
  '3': {
    summary:
      'Dollar and Sense is a demo article about financial forecasting. Its purpose is to show the blog layout, related posts and search integration.',
    faq: [],
  },
}

export const postGeo = (n: string, data: PostData): PostData => ({ ...data, ...geo[n] })
