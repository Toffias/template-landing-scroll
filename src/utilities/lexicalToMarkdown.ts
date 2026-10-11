/**
 * Minimal, dependency-free Lexical → Markdown serializer for /llms-full.txt.
 * Unlike the editor's converter it never throws on custom blocks: blocks with a nested
 * `content`/`richText` are serialized recursively, others are skipped.
 */
type Node = {
  type?: string
  tag?: string
  text?: string
  format?: number
  listType?: string
  children?: Node[]
  fields?: Record<string, unknown> & { url?: string; code?: string; language?: string }
  root?: Node
}

const IS_BOLD = 1
const IS_ITALIC = 2
const IS_CODE = 16

function inline(nodes: Node[] = []): string {
  return nodes
    .map((n) => {
      if (n.type === 'text') {
        let t = n.text || ''
        if (!t.trim()) return t
        if ((n.format || 0) & IS_CODE) return '`' + t + '`'
        if ((n.format || 0) & IS_BOLD) t = `**${t}**`
        if ((n.format || 0) & IS_ITALIC) t = `*${t}*`
        return t
      }
      if (n.type === 'linebreak') return '\n'
      if (n.type === 'link' || n.type === 'autolink') {
        const url = n.fields?.url
        const label = inline(n.children)
        return url ? `[${label}](${url})` : label
      }
      return inline(n.children)
    })
    .join('')
}

function block(n: Node, depth = 0): string {
  switch (n.type) {
    case 'heading': {
      const level = Number((n.tag || 'h2').slice(1)) || 2
      return `${'#'.repeat(Math.min(level + 1, 6))} ${inline(n.children)}`
    }
    case 'paragraph':
      return inline(n.children)
    case 'quote':
      return `> ${inline(n.children)}`
    case 'list':
      return (n.children || [])
        .map((li, i) => {
          const nested = (li.children || []).filter((c) => c.type === 'list')
          const own = inline((li.children || []).filter((c) => c.type !== 'list'))
          const bullet = n.listType === 'number' ? `${i + 1}.` : '-'
          return [
            `${'  '.repeat(depth)}${bullet} ${own}`,
            ...nested.map((l) => block(l, depth + 1)),
          ].join('\n')
        })
        .join('\n')
    case 'horizontalrule':
      return '---'
    case 'block': {
      const f = n.fields || {}
      if (typeof f.code === 'string') return '```' + (f.language || '') + '\n' + f.code + '\n```'
      const nested = (f.content || f.richText) as Node | undefined
      return nested?.root ? toMarkdown(nested) : ''
    }
    default:
      return n.children ? n.children.map((c) => block(c, depth)).join('\n\n') : ''
  }
}

export function toMarkdown(data: unknown): string {
  const root = (data as Node | null)?.root
  if (!root?.children) return ''
  return root.children
    .map((n) => block(n))
    .filter((s) => s.trim())
    .join('\n\n')
    .trim()
}
