import { getServerSideURL } from '@/utilities/getURL'

// Sitemap index pointing at the per-collection sitemaps (pages + posts).
export function GET() {
  const url = getServerSideURL()
  const now = new Date().toISOString()
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${url}/pages-sitemap.xml</loc><lastmod>${now}</lastmod></sitemap>
  <sitemap><loc>${url}/posts-sitemap.xml</loc><lastmod>${now}</lastmod></sitemap>
</sitemapindex>`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
