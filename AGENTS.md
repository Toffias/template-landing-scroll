# Manual para agentes de IA — Template Landing Scroll

Este repo es un **template** para producir sitios con:

1. **Landing inmersiva "scroll world"**: el scroll mueve una cámara pre-renderizada que
   entra en cada escena y vuela a la siguiente sin cortes (técnica de las páginas de
   producto de Apple). Escenas y clips se generan con IA (GPT Image 2 + Seedance 2.0 vía
   Higgsfield / Monid).
2. **Payload CMS 3** dentro de Next.js 16: todo el contenido es editable en `/admin`.
3. **Blog** (colección Posts) con búsqueda, categorías y posts relacionados.
4. **SEO + GEO** listos: metadatos, canonical, JSON-LD, sitemap, robots con crawlers de IA,
   `/llms.txt` y `/llms-full.txt`.

Idioma de trabajo con el usuario: **español**. Código, nombres y comentarios: inglés.

## Cómo trabajar acá

- **Proyecto nuevo / landing nueva / cliente nuevo** → cargá la skill `scroll-landing`
  (`.claude/skills/scroll-landing/SKILL.md`) y seguí sus fases. Es el playbook completo.
- **Assets de video, prompts, costuras, encode** → skill `scroll-world` + su
  `PROJECT-NOTES.md` (las notas mandan sobre la skill upstream).
- **Estrategia, copy y sistema visual** → skill `landing-page-design` + `PROJECT-NOTES.md`.
- **SEO, GEO, blog, Site Settings** → skill `seo-geo-content`.
- **Código de Payload** (colecciones, campos, hooks, access, queries) → skill `payload`.

### Reglas que no se negocian

1. **Nada pago sin aprobación.** Antes de generar imágenes o video, presentá el costo
   estimado y esperá un "sí" explícito (scroll-landing → Fase 3).
2. **Regla de la costura.** Los extremos de un conector son los **fotogramas reales**
   renderizados de los clips vecinos (`pnpm world:frames`), nunca las stills. Un modelo de
   video para toda la cadena.
3. **El texto vive en HTML, no en el video.** Todo copy importante va en los campos del
   bloque (se renderiza en el servidor). Nunca quemes texto dentro de imágenes o clips.
4. **No inventes** datos, testimonios, estadísticas ni reseñas. Si falta un dato, preguntá
   o dejá un placeholder visible `[COMPLETAR: …]`.
5. **Login/OAuth los hace el usuario** (Higgsfield, Monid, deploys). Vos indicás el comando.
6. Después de cambiar un schema de Payload: `pnpm generate:types` (y
   `pnpm generate:importmap` si agregaste componentes de admin). Después: `pnpm typecheck`.

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Next + Payload en http://localhost:3000 (admin en `/admin`). |
| `pnpm seed` | **Borra** y re-siembra la base con la demo (landing procedural, posts, Site Settings). |
| `pnpm world:new <slug>` | Crea `world/<slug>/` (BRIEF.md + world.json) desde `world/_template`. |
| `pnpm world:frames world/<slug>` | Extrae fotogramas de costura de los clips crudos (`--mobile` para 9:16). |
| `pnpm world:encode world/<slug>` | Encodea clips para scrub (desktop crf20/GOP8, mobile 720w/GOP4) + posters + `dist/manifest.json`. |
| `pnpm world:import world/<slug> [publish]` | Sube `dist/` a Payload y crea/actualiza el bloque ScrollWorld de la página (borrador por defecto). |
| `pnpm world:demo` | Regenera la demo procedural (fractales con ffmpeg, sin créditos). |
| `pnpm generate:types` | Regenera `src/payload-types.ts`. |
| `pnpm typecheck` · `pnpm lint` · `pnpm build` | Verificación. |

Requisitos: Node ≥ 20.18, pnpm, ffmpeg/ffprobe en el PATH. Python + Pillow solo para
`knockout.py` (escenas flotantes, opcional).

## Arquitectura

```
src/
  blocks/ScrollWorld/        ← motor de scroll (config Payload + server comp + client engine + CSS)
  blocks/FAQ/                ← FAQ con FAQPage JSON-LD
  blocks/…                   ← bloques del template oficial (CTA, Content, Media, Archive, Form)
  collections/Pages|Posts    ← Pages.layout incluye scrollWorld y faq; Posts tiene tab GEO (summary, faq)
  globals/SiteSettings.ts    ← identidad, organización, sameAs, política de crawlers IA, llms
  utilities/generateMeta.ts  ← title/description/canonical/OG/Twitter
  utilities/structuredData.ts← Organization, WebSite, BlogPosting, BreadcrumbList, FAQPage
  utilities/llms.ts          ← /llms.txt y /llms-full.txt
  app/robots.ts              ← robots con bots de IA
  app/(frontend)/…           ← sitio público (llms*.txt, sitemaps, páginas, posts)
  endpoints/seed/            ← datos demo (world/ = clips procedurales versionados)
scripts/world/               ← pipeline de assets (Node + ffmpeg, multiplataforma)
scripts/seed.ts              ← seed por CLI
world/_template/             ← plantilla de proyecto (BRIEF.md, world.json)
world/<slug>/                ← un proyecto: world.json + prompts/ (versionados); stills/raw/frames/dist (ignorados)
.claude/skills/              ← scroll-landing, scroll-world, landing-page-design, seo-geo-content, payload
.mcp.json                    ← MCP de Higgsfield (https://mcp.higgsfield.ai/mcp, OAuth)
docs/                        ← scroll-world.md, seo-geo.md, deploy.md
```

### El bloque ScrollWorld

- `config.ts`: escenas (copy + still/clip + versiones 9:16 + pacing `scroll`/`linger` + CTA),
  conectores, settings (diveScroll, connScroll, crossfade, theme).
- `Component.tsx` (server): resuelve uploads a URLs.
- `Component.client.tsx`: port a React del `scrub-engine.js` upstream. Stage `sticky`
  dentro de la página (los bloques siguientes se ven después), clips cargados como Blob
  (siempre seekables), seeks suavizados con rAF, crossfade en costuras, rail de escenas,
  reduced-motion → stills, endurecimiento mobile (seek coalescing, priming iOS).
- Si el ScrollWorld es el primer bloque de una página **sin hero**, su primera escena es
  el `<h1>` y el header del sitio se superpone (`--site-header-h` en `globals.css`).

### Datos (local vs producción)

- Local: SQLite (`DATABASE_URL=file:./payload.db`) y medios en `public/media/`.
- Producción: ver `docs/deploy.md` (Postgres o Turso + storage de medios).

## Convenciones

- TypeScript estricto; formato con Prettier (`.prettierrc.json`).
- Bloques nuevos: `src/blocks/<Nombre>/{config.ts,Component.tsx}`, registrarlos en
  `collections/Pages/index.ts` y `blocks/RenderBlocks.tsx`, luego `pnpm generate:types`.
- Textos de UI pública en el idioma del sitio (`Site Settings → locale`).
- No commitees `.env`, `*.db`, `public/media/`, ni `world/*/{raw,frames,dist,stills}`.

## Créditos

- `scroll-world` skill + motor original: [oso95/scroll-world](https://github.com/oso95/scroll-world) (MIT).
- `landing-page-design` skill: [elayadesign/ai-design-skills](https://github.com/elayadesign/ai-design-skills) (MIT).
- Base: [Payload Website Template](https://github.com/payloadcms/payload/tree/3.x/templates/website) (MIT).
