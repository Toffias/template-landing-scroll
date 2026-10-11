---
name: scroll-landing
description: >
  Playbook end-to-end para entregar un proyecto con este template: landing inmersiva con
  scroll cinematográfico generado con IA (Higgsfield/Seedance), Payload CMS, blog y SEO/GEO.
  Orquesta las skills scroll-world (assets y costuras), landing-page-design (estrategia,
  copy y sistema visual), seo-geo-content (SEO/GEO y blog) y payload (CMS). Usar cuando el
  usuario pida "armar la landing", "nuevo proyecto", "nuevo cliente", "landing con scroll",
  "fly-through", "mundo scrolleable", o retomar un proyecto en world/<proyecto>.
allowed-tools: Bash, Read, Write, Edit, AskUserQuestion, Skill
---

# scroll-landing — de la entrevista al deploy

Una landing de este template = **un ScrollWorld** (escenas de video que el scroll recorre)
+ **bloques de Payload** debajo (prueba, FAQ, blog, contacto) + **SEO/GEO** + **blog**.
Trabajás por fases. Cada fase termina con un entregable verificable; no saltes fases.

Skills que vas a cargar (con la herramienta Skill) en el momento indicado:

| Skill | Para qué | Cuándo |
|---|---|---|
| `scroll-world` + su `PROJECT-NOTES.md` | Prompts, modelos, regla de la costura, encode, QA | Fases 2–5 |
| `landing-page-design` + `PROJECT-NOTES.md` | Intake de conversión, estructura, copy, sistema visual | Fases 1 y 6 |
| `seo-geo-content` | Site Settings, metadatos, FAQ, artículos del blog, checklist | Fases 1, 6 y 7 |
| `payload` | Cualquier cambio de colecciones, bloques, hooks o queries | Cuando toques código de Payload |

## Fase 0 — Preparar el entorno (una vez por máquina)

1. `pnpm install` · `cp .env.example .env` (ajustar `PAYLOAD_SECRET`) · `pnpm dev`.
2. Verificá herramientas: `ffmpeg -version`, `ffprobe -version`, `python --version` (+ `pip show pillow`
   solo si vas a usar `knockout.py`).
3. Generación: comprobá **qué backend hay** y decíselo al usuario:
   - MCP de Higgsfield (`.mcp.json`): si sus tools no aparecen, el usuario debe aprobar el
     servidor y autenticarse por OAuth en el navegador (vos no podés hacer el login).
   - Higgsfield CLI: `higgsfield workspace list` (auth: `higgsfield auth login`, interactivo → lo corre el usuario).
   - Monid CLI (backend por defecto de video en scroll-world): `monid balance`.
   Sin ningún backend → se puede avanzar con copy, diseño, CMS y la demo procedural; los
   clips quedan pendientes.

## Fase 1 — Entrevista y brief

1. `pnpm world:new <slug>` → crea `world/<slug>/` con `BRIEF.md` y `world.json`.
2. Entrevistá al usuario y completá `BRIEF.md`. Combiná:
   - scroll-world Step 1: tema (pregunta **abierta**, nunca multiple choice), brand kit,
     dirección de arte, **cámara** (siempre preguntar), escenas 5–7, **mobile** (siempre
     preguntar, con costo), presupuesto.
   - landing-page-design A1: acción principal, oferta, audiencia, objeciones, pruebas.
   - seo-geo-content: keyword principal, preguntas reales de clientes, perfiles sameAs,
     datos de la organización, 3 primeros artículos.
   Preguntá todo lo que falte **en un solo lote**. Lo que el usuario no sepa: asumí, decilo
   en una línea y seguí.
3. Entregable: `BRIEF.md` completo y validado por el usuario.

## Fase 2 — Guion y copy del recorrido

1. Pasá las escenas al `world.json`: `id`, `label`, `accent`, `eyebrow`, `title`, `body`,
   `tags`, `subject`, `focal`, `scroll`, `linger`, y `cta` en la última.
2. Reglas de copy (landing-page-design A5 + GEO):
   - Escena 1 `title` = H1: resultado + audiencia, ≤ 70 caracteres, con la keyword principal.
   - Cada `body` = una frase concreta y verificable (números, materiales, lugares), no adjetivos.
   - El texto es HTML real e indexable: escribilo para humanos **y** para que una IA lo pueda citar.
3. `palette`, `stylePreamble`, `camera`, `mobile` y `settings.theme` (bg = fondo de las escenas).
4. Entregable: `world.json` con todo el copy, aprobado por el usuario.

## Fase 3 — Presupuesto (gate obligatorio)

Calculá con scroll-world Step 1.7: `N stills + (2N−1) videos` (arquitectura B) o
`N stills + N videos` (A), ×2 videos si hay mobile, +15 % de re-rolls. Calibrá con 1 still
+ 1 video antes de extrapolar. Escribilo en `BRIEF.md → Presupuesto` y **no generes nada
pago hasta que el usuario diga que sí** (`budget.approved: true` en world.json).
Sugerí el tier draft (480p/720p) para previsualizar el recorrido completo primero.

## Fase 4 — Stills

1. Escribí `world/<slug>/prompts/style.txt` (style preamble, idéntico en todas) y
   `prompts/still_<i>.txt` con las plantillas de `scroll-world/references/prompts.md`.
2. Generá una imagen por escena (MCP de Higgsfield, CLI o Codex) → `stills/<id>.png`.
3. Mostrale las stills al usuario. Deben leerse como **un solo mundo** (mismo ángulo,
   paleta, luz). Regenerá las que desentonen pasando una aprobada como referencia.
4. Entregable: N stills aprobadas.

## Fase 5 — Clips de cámara y costuras

Seguí scroll-world Steps 4–6 al pie de la letra. Resumen operativo en este repo:

- **Un solo modelo de video para toda la cadena** (default `seedance_2_0`).
- **B (fly-through):** dives en paralelo desde cada still → `raw/dive_<i>.mp4`.
  Después `pnpm world:frames world/<slug>` → `frames/seam_<i>_start.png` (último frame del
  dive i) y `seam_<i>_end.png` (primer frame del dive i+1) → conectores con imagen inicial
  **y** final = esos frames → `raw/conn_<i>.mp4`.
- **A (walkthrough / locked-iso):** legs secuenciales; después de cada leg,
  `pnpm world:frames world/<slug>` y usá `frames/leg_<i>_last.png` como imagen inicial del
  siguiente. Sin imagen final, sin conectores.
- Mirá el último frame de cada leg antes de encadenar el siguiente.
- NSFW falso positivo: re-roll → quitar palabras gatillo → `kling3_0` para ese clip → slot vacío.
- Mobile (solo si se aprobó): cadena 9:16 nativa → `clipMobile` / `connectorsMobile`.
- `pnpm world:encode world/<slug>` → `dist/` + `manifest.json` (avisa si un mobile es apaisado).

**Nunca** uses las stills como extremos de un conector. **Nunca** mezcles modelos en la cadena.

## Fase 6 — Página en Payload

1. Completá **Site Settings** en `/admin/globals/site-settings` (identidad, organización,
   sameAs, GEO/llms) — ver seo-geo-content §1.
2. `pnpm world:import world/<slug>` → crea/actualiza la página `page.slug` como **borrador**
   con el ScrollWorld (y un FAQ si `world.json` tiene `faq`).
3. Debajo del ScrollWorld agregá los bloques que pide landing-page-design A2: prueba
   social, objeciones/beneficios (`content`), `faq`, `archive` (blog), `cta`/`formBlock`.
4. SEO tab de la página: meta title/description/imagen OG (seo-geo-content §2).
5. Revisá en Live Preview, publicá cuando el usuario apruebe.

## Fase 7 — Blog y GEO

Seguí `seo-geo-content` §3–§4: 3 artículos iniciales que respondan preguntas reales,
cada uno con `summary` (TL;DR), headings con forma de pregunta, datos con fuente, FAQ,
categoría, imagen OG. Borrá o reemplazá los posts demo del seed.

## Fase 8 — QA y entrega

- [ ] `pnpm typecheck` y `pnpm lint` sin errores; `pnpm build` OK.
- [ ] Costuras: scrolleá despacio por cada seam (y hacia atrás) — sin "pop" ni rebobinado.
- [ ] Phone (emulado + CPU throttling): no se congela, primera escena visible al instante.
- [ ] `prefers-reduced-motion`: se ven las stills, sin video.
- [ ] HTML servido contiene el H1 y los titulares de todas las escenas (`curl -s /`).
- [ ] `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llms-full.txt` correctos con la URL de producción.
- [ ] JSON-LD válido (Organization + WebSite en todas; BlogPosting/FAQPage donde corresponda) —
      validar en https://validator.schema.org.
- [ ] Peso: cada clip desktop ≲ 10 MB; el primer clip carga primero (el resto es lazy).
- [ ] Deploy: ver `docs/deploy.md` (DB y storage de medios de producción).

Entregá al usuario: URL, qué se generó y cuánto costó, qué quedó pendiente.
