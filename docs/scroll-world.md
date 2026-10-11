# Scroll World — cómo funciona

## La técnica

La página no anima 3D en tiempo real: reproduce **videos pre-renderizados** y el scroll
controla su `currentTime`. La cámara se mueve de verdad dentro del clip; el scroll solo
maneja el tiempo (igual que las páginas de producto de Apple).

```
escena 1            conector 1→2         escena 2            conector 2→3         escena 3
[ dive_0 ]  ──►  [ conn_0 ]  ──►  [ dive_1 ]  ──►  [ conn_1 ]  ──►  [ dive_2 ]
  still_0 ──┘      ▲ último frame de dive_0   ▲ primer frame de dive_1
```

- **Dive**: la cámara entra desde afuera hacia el interior de la escena (imagen inicial = still).
- **Conector**: sale de la escena i y llega a la i+1. Imagen inicial = **último frame real de
  dive_i**, imagen final = **primer frame real de dive_i+1**. Así cada costura es idéntica
  frame a frame. Un crossfade corto (≈ 0.12 vh) tapa la pequeña deriva del modelo.
- **Arquitectura A** (walkthrough / locked-iso): sin conectores; cada tramo arranca en el
  último frame del anterior y la cámara solo avanza.

## Producción de assets

| Paso | Herramienta | Salida |
|---|---|---|
| Stills (1 por escena) | GPT Image 2 (Higgsfield MCP/CLI, o Codex) | `world/<slug>/stills/*.png` |
| Dives / legs | Seedance 2.0 (Monid por defecto, Higgsfield fallback) | `raw/dive_<i>.mp4` |
| Frames de costura | `pnpm world:frames world/<slug>` | `frames/seam_<i>_{start,end}.png` |
| Conectores (solo B) | mismo modelo, imagen inicial + final | `raw/conn_<i>.mp4` |
| Encode + posters | `pnpm world:encode world/<slug>` | `dist/*` + `manifest.json` |
| Carga al CMS | `pnpm world:import world/<slug>` | Página con bloque ScrollWorld (borrador) |

Costo orientativo (scroll-world, 2026-07): N stills + (2N−1) videos. Seis escenas a 1080p
≈ USD 27 en Monid; ×2 con versión mobile 9:16 nativa. Siempre calibrar con 1 still + 1
video antes de extrapolar.

## Encoding (por qué así)

- El motor descarga cada clip como **Blob** → siempre se puede hacer seek aunque el
  hosting no soporte byte-ranges. Por eso no hace falta all-intra.
- Desktop: resolución nativa, `crf 20`, `-g 8`, sin audio, `+faststart`, `unsharp` leve.
- Mobile (opt-in, cadena 9:16 nativa): 720 px de ancho, `crf 23`, `-g 4`.
- Poster = primer frame del clip encodeado (el cambio still→video es invisible).

## El bloque en Payload (`src/blocks/ScrollWorld`)

| Campo | Uso |
|---|---|
| `sections[]` | `label`, `anchor`, `accent`, `eyebrow`, `title` (H1 en la primera si no hay hero), `body`, `tags`, `still`, `clip`, `stillMobile`, `clipMobile`, `scroll` (vh de scroll; más = más tiempo en la escena), `linger` (0–0.6: la cámara se frena a mitad de escena mientras el texto está al máximo), `cta` |
| `connectors[]` | `clip`, `clipMobile`. Slot vacío → crossfade directo entre escenas |
| Settings | `diveScroll` (1.3), `connScroll` (0.9), `crossfade` (0.12; 0.08 para A), `hint`, `showRoute`, `showProgress`, `atmosphere`, `theme` (`background`, `ink`, `inkSoft`, `accent`) |

Pacing recomendado: escena inicial y final con `scroll` 1.6 + `linger` 0.3–0.45; escenas de
tránsito más rápidas.

## Comportamiento del motor

- Stage `position: sticky` dentro de una sección de altura `(Σ pesos + 1) × viewport`;
  al terminar, la página continúa con los bloques siguientes.
- Precarga clips a ±1.6 viewports; seeks interpolados con rAF (0.18/frame).
- Teléfono (pointer coarse o ≤ 860 px): sirve `clipMobile`, no encola seeks mientras el
  decoder está ocupado, mantiene el poster hasta que el video pinta, "prima" los videos en
  el primer toque (iOS), ignora los resize del URL bar.
- `prefers-reduced-motion`: no carga videos; las stills hacen crossfade.
- Sin JS: el HTML ya tiene todo el texto (primera escena visible).

## Problemas comunes

Ver la sección *Gotchas* de `.claude/skills/scroll-world/SKILL.md`. Los más frecuentes:
pop en la costura (se usaron stills como extremos), rebobinado (arquitectura B en estética
realista), video congelado (sin blob), archivos enormes (all-intra), NSFW falso positivo
(re-roll / quitar palabras gatillo / kling3_0 / slot vacío).
