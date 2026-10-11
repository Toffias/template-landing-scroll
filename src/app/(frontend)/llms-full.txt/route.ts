import { buildLlms } from '@/utilities/llms'

export const revalidate = 3600

export async function GET() {
  const body = await buildLlms({ full: true })
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}
