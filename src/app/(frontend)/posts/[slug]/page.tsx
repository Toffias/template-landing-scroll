import type { Metadata } from 'next'

import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import RichText from '@/components/RichText'

import type { Post } from '@/payload-types'

import { PostHero } from '@/heros/PostHero'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { JsonLd } from '@/components/JsonLd'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import { articleSchema, breadcrumbSchema, faqSchema } from '@/utilities/structuredData'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = posts.docs.map(({ slug }) => {
    return { slug }
  })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Post({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/posts/' + decodedSlug
  const post = await queryPostBySlug({ slug: decodedSlug })

  if (!post) return <PayloadRedirects url={url} />

  const site = await getSiteSettings()
  const schema = [
    articleSchema(post, site),
    breadcrumbSchema([
      { name: site.siteName || 'Home', path: '/' },
      { name: 'Blog', path: '/posts' },
      { name: post.title, path: url },
    ]),
    ...(post.faq?.length ? [faqSchema(post.faq)] : []),
  ]

  return (
    <article className="pt-16 pb-16">
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}
      <JsonLd data={schema} />

      <PostHero post={post} />

      <div className="flex flex-col items-center gap-4 pt-8">
        <div className="container">
          {post.summary && (
            <aside
              aria-label="Resumen"
              className="max-w-[48rem] mx-auto mb-10 rounded-lg border border-border bg-card p-6"
            >
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Resumen
              </p>
              <p className="text-lg leading-relaxed m-0">{post.summary}</p>
            </aside>
          )}
          <RichText className="max-w-[48rem] mx-auto" data={post.content} enableGutter={false} />
          {post.faq && post.faq.length > 0 && (
            <section className="max-w-[48rem] mx-auto mt-16" aria-labelledby="post-faq">
              <h2 id="post-faq" className="text-2xl font-semibold mb-6">
                Preguntas frecuentes
              </h2>
              {post.faq.map((q, i) => (
                <div key={q.id || i} className="border-t border-border py-5">
                  <h3 className="text-lg font-medium mb-2">{q.question}</h3>
                  <p className="text-muted-foreground leading-relaxed m-0">{q.answer}</p>
                </div>
              ))}
            </section>
          )}
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <RelatedPosts
              className="mt-12 max-w-[52rem] lg:grid lg:grid-cols-subgrid col-start-1 col-span-3 grid-rows-[2fr]"
              docs={post.relatedPosts.filter((post) => typeof post === 'object')}
            />
          )}
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const post = await queryPostBySlug({ slug: decodedSlug })

  return generateMeta({ doc: post, path: `/posts/${decodedSlug}` })
}

const queryPostBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})
