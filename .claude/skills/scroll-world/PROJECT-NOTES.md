# scroll-world — notas de este template

`SKILL.md` y `references/` son la skill upstream **sin modificar**
([oso95/scroll-world](https://github.com/oso95/scroll-world) @ `71cc36d`, MIT — ver `LICENSE`).
Seguí su procedimiento (entrevista → stills → dives → conectores → encode → QA) y su
**regla de la costura**. En este repo, cuatro cosas cambian. Estas notas tienen prioridad
sobre la skill cuando chocan:

| Upstream dice | En este template |
|---|---|
| Copiá `references/scrub-engine.js` + `index-template.html` a tu proyecto (Step 7) | **No.** El motor ya está portado a React como bloque de Payload: `src/blocks/ScrollWorld/`. El texto de cada escena se renderiza en el servidor (SEO/GEO). El JS vanilla queda solo como referencia. |
| Scripts bash de `references/pipeline.md` (bash 3.2, macOS) | Usá los scripts Node multiplataforma (Windows incluido): `pnpm world:frames`, `pnpm world:encode`. Hacen exactamente los mismos comandos ffmpeg (seam frames, crf 20 / GOP 8, mobile 720w / GOP 4, posters). Los prompts y la parte de generación de pipeline.md siguen valiendo. |
| Cablear `mountScrollWorld({...})` con URLs | Escribí todo en `world/<proyecto>/world.json` y corré `pnpm world:import world/<proyecto>` → sube los medios a Payload y crea/actualiza el bloque ScrollWorld de la página (como borrador). |
| Higgsfield **CLI** (`higgsfield generate create …`) | Este repo además declara el **MCP de Higgsfield** en `.mcp.json` (`https://mcp.higgsfield.ai/mcp`, OAuth, sin API key). Podés generar stills y clips desde el MCP si la herramienta de video acepta imagen inicial **y** final (verificá el schema de la tool antes de generar conectores). Si no la acepta, usá la CLI o Monid como dice la skill — **nunca** generes un conector sin frame-lock. |

Ubicación de archivos por proyecto (todo relativo a `world/<proyecto>/`):

```
BRIEF.md          entrevista + presupuesto aprobado
world.json        fuente de verdad (copy, paleta, cámara, rutas de clips)
prompts/          style preamble + prompt por escena / dive / conector (versionado)
stills/           imágenes por escena (no versionado)
raw/              renders crudos dive_i.mp4 / conn_i.mp4 (no versionado)
frames/           seam_i_start.png / seam_i_end.png (no versionado)
dist/             encodes + posters + manifest.json (no versionado)
```

Mapeo de arquitecturas al bloque:
- **B (fly-through)**: `connectors[i]` = clip del conector i→i+1. Un slot vacío = crossfade directo.
- **A (walkthrough / locked-iso)**: sin conectores; `camera` en world.json en
  `walkthrough` o `locked-iso` hace que `world:frames` extraiga `leg_i_last.png` y que
  `world:import` ponga `crossfade` 0.08.

QA (Step 8) en este repo: `pnpm dev`, abrir la página, scrollear cada costura y revisar
`/llms.txt` + el HTML (los titulares de escena deben estar en el HTML servido).
