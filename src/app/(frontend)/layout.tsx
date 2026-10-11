import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'

import './globals.css'
import { JsonLd } from '@/components/JsonLd'
import { getServerSideURL } from '@/utilities/getURL'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import { organizationSchema, websiteSchema } from '@/utilities/structuredData'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  const site = await getSiteSettings()

  return (
    <html
      className={cn(GeistSans.variable, GeistMono.variable)}
      lang={site.locale || 'es'}
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link href="/llms.txt" rel="alternate" type="text/markdown" title="llms.txt" />
        {/* Site-wide entity graph: every page states who publishes it (GEO). */}
        <JsonLd data={[organizationSchema(site), websiteSchema(site)]} />
      </head>
      <body>
        <Providers>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />

          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings()
  return {
    metadataBase: new URL(getServerSideURL()),
    title: site.siteName,
    description: site.description,
    applicationName: site.siteName,
    openGraph: mergeOpenGraph({ siteName: site.siteName }),
    twitter: {
      card: 'summary_large_image',
      creator: site.twitterHandle || undefined,
    },
  }
}
