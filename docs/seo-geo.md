# SEO + GEO en el template

**SEO** = que Google/Bing indexen y rankeen. **GEO** (Generative Engine Optimization) = que
ChatGPT, Perplexity, Claude, Gemini, Copilot y Google AI Overviews entiendan quién sos y
**citen** tu contenido. Comparten la base técnica; GEO suma señales de entidad, contenido
citable y acceso explícito para los crawlers de IA.

## Implementado

| Pieza | Dónde | Notas |
|---|---|---|
| Identidad del sitio | Global **Site Settings** (`src/globals/SiteSettings.ts`) | Nombre, descripción, locale, organización, sameAs, política de crawlers IA, resumen para llms.txt |
| `<title>`, description, canonical, OG, Twitter | `src/utilities/generateMeta.ts` | `Título · separador · siteName`; imagen OG del doc → Site Settings → fallback |
| `<html lang>` | `layout.tsx` | Desde `Site Settings → locale` |
| JSON-LD Organization + WebSite (+ SearchAction) | `layout.tsx` + `utilities/structuredData.ts` | En todas las páginas, con `@id` estables |
| JSON-LD BlogPosting + BreadcrumbList (+ FAQPage) | `posts/[slug]/page.tsx` | Autor = Person (o la Organization), `abstract` = summary, keywords = categorías |
| JSON-LD FAQPage | Bloque **FAQ** | Opción `emitSchema` |
| TL;DR y FAQ por post | Posts → tab **GEO** | `summary` arriba del artículo; `faq` al final |
| Copy de la landing en HTML | Bloque ScrollWorld | SSR: todos los titulares y textos están en el HTML servido |
| `robots.txt` | `src/app/robots.ts` | Permite bots de búsqueda IA (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, PerplexityBot…) y de entrenamiento (GPTBot, ClaudeBot, Google-Extended…); bloquea `/admin`, `/api`, `/search` |
| Sitemaps | `/sitemap.xml` → `/pages-sitemap.xml`, `/posts-sitemap.xml` | Solo documentos publicados |
| `/llms.txt` | `src/utilities/llms.ts` | Spec llmstxt.org: H1, resumen, páginas, posts |
| `/llms-full.txt` | idem | Contenido completo en Markdown (escenas, FAQ, posts) |
| Redirects 301 | Plugin redirects (admin) | Al cambiar slugs |
| Búsqueda interna | Plugin search | `/search` con `noindex` |

## Checklist de lanzamiento

1. `NEXT_PUBLIC_SERVER_URL` = dominio final con https (canonical, sitemaps, JSON-LD y llms
   dependen de esto). Rebuild después de cambiarlo.
2. Site Settings completo (ver skill `seo-geo-content` §1), en especial `sameAs`.
3. Cada página publicada con meta title/description/OG.
4. Validar JSON-LD: https://validator.schema.org y Rich Results Test de Google.
5. Google Search Console + Bing Webmaster Tools: verificar dominio y enviar `/sitemap.xml`
   (Bing alimenta a Copilot y a ChatGPT search).
6. Perfil de Google Business si hay presencia física (mismo nombre/dirección/teléfono).
7. Auditoría GEO del sitio publicado: skills `geo-audit` / `geo-citability` / `geo-crawlers`
   si están instaladas.

## Contenido que citan las IA

- Respuesta directa primero, contexto después.
- Pasajes autocontenidos de 40–80 palabras.
- Datos concretos con fuente y fecha.
- Headings con forma de pregunta.
- Autor real y experiencia de primera mano (E-E-A-T).
- Consistencia de entidad: el mismo nombre, descripción y enlaces en todos lados.

Guía de redacción completa: `.claude/skills/seo-geo-content/SKILL.md`.
