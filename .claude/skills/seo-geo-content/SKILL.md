---
name: seo-geo-content
description: >
  Estándar de SEO + GEO (Generative Engine Optimization) para este template Payload:
  Site Settings, metadatos por página, datos estructurados, FAQ, robots/llms.txt y cómo
  escribir artículos del blog que Google indexe y que ChatGPT, Perplexity, Claude, Gemini y
  AI Overviews citen. Usar al cargar contenido, escribir o revisar posts, configurar la
  identidad del sitio, o cuando el usuario diga "SEO", "GEO", "blog", "artículo", "post",
  "schema", "llms.txt", "posicionamiento" o "que me citen las IA".
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion, Skill
---

# seo-geo-content

El template ya implementa la parte técnica (ver `docs/seo-geo.md`). Tu trabajo es el
**contenido y la configuración**: que cada dato exista, sea consistente y sea citable.
Para auditar un sitio publicado podés usar además las skills globales `geo-*`
(`geo-audit`, `geo-citability`, `geo-schema`…) si están instaladas.

## 1. Site Settings (`/admin/globals/site-settings`) — primero que todo

| Campo | Regla |
|---|---|
| `siteName` | Nombre de marca exacto, igual que en redes y Google Business. |
| `tagline` | Qué es + para quién, una línea. |
| `description` | 120–160 caracteres. Es la meta description por defecto **y** la descripción de la Organization. |
| `locale` | `es`, `es-AR`, `en`… (va a `<html lang>`, OG y JSON-LD). |
| `organizationType` | `LocalBusiness`/`ProfessionalService`/`Store` si hay atención física; si no `Organization`. |
| Contacto + dirección | Completar si existen: son señales de entidad (NAP consistente). |
| `sameAs` | **Todos** los perfiles oficiales (LinkedIn, Instagram, YouTube, GitHub, Google Business, Wikidata). Es la señal de entidad más fuerte para las IA. |
| `allowAICrawlers` | `true` salvo pedido explícito del cliente. Apagarlo saca al sitio de ChatGPT search / Perplexity / Claude. |
| `llmsSummary` | 2–4 frases factuales: quién, qué, dónde, para quién, diferencial. Va arriba de `/llms.txt`. |
| `llmsDetails` | Markdown opcional: datos clave, zona de servicio, modelo de precios, horarios. |
| `defaultOgImage` | 1200×630 con marca. |

## 2. Cada página

- **Título SEO** ≤ 60 caracteres, keyword al principio. **Descripción** 120–160, con
  beneficio + llamada a la acción. **Imagen OG** 1200×630. (Tab *SEO* del documento.)
- **Un solo H1** por página. En una landing scroll-world el H1 es el `title` de la primera
  escena (no agregues hero). En otras páginas lo pone el hero.
- Slugs cortos, en minúscula, con guiones, sin stopwords.
- Contenido real en HTML: nunca metas texto importante dentro de un video o imagen.
- Agregá un bloque **FAQ** con 3–6 preguntas reales cuando la página responda dudas
  (genera `FAQPage` automáticamente).

## 3. Artículos del blog (colección Posts)

Cada post responde **una** pregunta concreta que hace la audiencia. Estructura:

1. **Título** con la pregunta o la promesa (≤ 60 caracteres en el meta title).
2. **Tab GEO → `summary`**: 2–3 frases que **responden directamente** la pregunta. Se
   muestra arriba del artículo, va al JSON-LD (`abstract`) y a `/llms.txt`. Es el pasaje
   que más citan las IA.
3. **Cuerpo**:
   - H2/H3 con forma de pregunta o afirmación concreta; cada sección arranca con la
     respuesta en 1–2 frases y después el desarrollo (pirámide invertida).
   - Párrafos de 40–80 palabras autocontenidos (que se entiendan fuera de contexto).
   - Datos con número, fecha y **fuente enlazada**. Experiencia propia (casos, fotos,
     resultados) → E-E-A-T.
   - Listas y tablas para comparaciones y pasos.
   - Enlaces internos a la landing y a 2–3 posts relacionados (campo *Related Posts*).
4. **Tab GEO → `faq`**: 3–5 preguntas de seguimiento con respuestas de 40–80 palabras
   (genera `FAQPage`).
5. **Tab Meta**: categoría(s) (van a `keywords` del JSON-LD) y autor real (campo
   *Authors*: Person en el schema). Sin autor → se atribuye a la Organization.
6. **Tab SEO**: meta title, description, imagen OG.
7. `publishedAt` real. Actualizá posts viejos en vez de duplicarlos (`dateModified` se actualiza solo).

Longitud orientativa: 800–1.500 palabras para posts informativos; menos si la pregunta es
simple. Calidad > volumen. No inventes datos, estadísticas ni testimonios.

## 4. Checklist de publicación

- [ ] H1 único; jerarquía de headings sin saltos.
- [ ] Meta title/description completos y únicos.
- [ ] `summary` respondiendo la pregunta en ≤ 3 frases.
- [ ] Al menos un dato con fuente; al menos un enlace interno.
- [ ] Imágenes con `alt` descriptivo.
- [ ] FAQ cuando aplique.
- [ ] Verificar en el HTML servido: `curl -s <url> | grep application/ld+json`.
- [ ] Aparece en `/sitemap.xml` (posts-sitemap) y en `/llms.txt`.

## 5. Lo que ya hace el código (no lo dupliques)

- `<title>`, canonical, OG y Twitter: `src/utilities/generateMeta.ts`.
- JSON-LD Organization + WebSite en todas las páginas: `src/app/(frontend)/layout.tsx`.
- BlogPosting + BreadcrumbList + FAQPage en posts: `src/app/(frontend)/posts/[slug]/page.tsx`.
- FAQPage del bloque FAQ: `src/blocks/FAQ/Component.tsx`.
- `robots.txt` con crawlers de IA: `src/app/robots.ts`.
- `/sitemap.xml` (índice) → `/pages-sitemap.xml`, `/posts-sitemap.xml`.
- `/llms.txt` y `/llms-full.txt` generados desde Payload: `src/utilities/llms.ts`.
- Redirects 301 desde el admin (plugin redirects) — usalos al cambiar slugs.
