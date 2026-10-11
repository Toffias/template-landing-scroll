# Template Landing Scroll

Template para crear **landings inmersivas con scroll cinematográfico** (la cámara entra en
cada escena y vuela a la siguiente sin cortes mientras scrolleás), con **Payload CMS**,
**blog** y **SEO + GEO** listos. Pensado para trabajarse con un agente de IA (Claude Code,
Codex, Cursor) que sigue el manual incluido.

- **Next.js 16 + Payload CMS 3.90** (template oficial *website*): páginas con bloques,
  posts, categorías, formularios, búsqueda, redirects, live preview, borradores.
- **Bloque ScrollWorld**: port a React del motor de [oso95/scroll-world](https://github.com/oso95/scroll-world),
  con el texto renderizado en el servidor (indexable) y editable desde el admin.
- **Pipeline de assets** multiplataforma (Node + ffmpeg): frames de costura, encode para
  scrub, posters e importación automática a Payload.
- **SEO/GEO**: Site Settings, canonical, OG, JSON-LD (Organization, WebSite, BlogPosting,
  BreadcrumbList, FAQPage), sitemaps, robots con crawlers de IA, `/llms.txt`, `/llms-full.txt`.
- **Manual para IA**: `AGENTS.md` + skills en `.claude/skills/` (`scroll-landing`,
  `scroll-world`, `landing-page-design`, `seo-geo-content`, `payload`) + MCP de Higgsfield.

## Empezar

Requisitos: Node ≥ 20.18, pnpm, ffmpeg en el PATH.

```bash
pnpm install
```

```bash
cp .env.example .env
```

Cambiá `PAYLOAD_SECRET` en `.env`, después:

```bash
pnpm seed
```

```bash
pnpm dev
```

Abrí http://localhost:3000 (landing demo con clips procedurales) y http://localhost:3000/admin
(creá tu usuario la primera vez).

> `pnpm seed` borra pages, posts, media y categorías y carga la demo. También existe el
> botón "Seed your database" en el dashboard del admin.

## Crear una landing nueva con IA

Abrí el proyecto en Claude Code y pedí, por ejemplo:

> "Armemos la landing de mi cliente: una cervecería artesanal en Mendoza."

El agente carga la skill `scroll-landing` y sigue las fases: entrevista → guion y copy →
**presupuesto (te pide aprobación antes de gastar)** → stills → clips y costuras →
importación a Payload → blog y GEO → QA → deploy.

Para generar imágenes y video necesitás al menos uno de estos backends:

- **MCP de Higgsfield** (ya declarado en `.mcp.json`): Claude Code te pide aprobarlo y
  abre el login OAuth en el navegador. Más info: [higgsfield.ai/mcp](https://higgsfield.ai/mcp).
- **Higgsfield CLI** (`higgsfield auth login`) y/o **Monid CLI** (backend por defecto de la
  skill scroll-world para la cadena de video).

Sin backend podés avanzar con todo lo demás y probar con la demo procedural (`pnpm world:demo`).

## Pipeline manual

```bash
pnpm world:new mi-proyecto
```

Completá `world/mi-proyecto/world.json`, generá `stills/` y `raw/dive_<i>.mp4`, y luego:

```bash
pnpm world:frames world/mi-proyecto
```

Generá `raw/conn_<i>.mp4` con esos frames como imagen inicial/final, y después:

```bash
pnpm world:encode world/mi-proyecto
```

```bash
pnpm world:import world/mi-proyecto
```

La página queda como borrador en el admin para revisarla y publicarla.

## Documentación

- [AGENTS.md](AGENTS.md) — manual para agentes de IA (arquitectura, reglas, comandos).
- [docs/scroll-world.md](docs/scroll-world.md) — cómo funciona el efecto y el bloque.
- [docs/seo-geo.md](docs/seo-geo.md) — qué está implementado y checklist de lanzamiento.
- [docs/deploy.md](docs/deploy.md) — VPS vs Vercel, base de datos y storage.

## Créditos y licencias

- [oso95/scroll-world](https://github.com/oso95/scroll-world) — skill y motor de scrub (MIT).
- [elayadesign/ai-design-skills](https://github.com/elayadesign/ai-design-skills) — skill `landing-page-design` (MIT).
- [Payload Website Template](https://github.com/payloadcms/payload/tree/3.x/templates/website) (MIT).
