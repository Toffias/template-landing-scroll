import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import React from 'react'

export async function Header() {
  const [headerData, site] = await Promise.all([getCachedGlobal('header', 1)(), getSiteSettings()])
  const logo = typeof site.logo === 'object' && site.logo?.url ? site.logo.url : undefined

  return <HeaderClient data={headerData} siteName={site.siteName} logo={logo} />
}
