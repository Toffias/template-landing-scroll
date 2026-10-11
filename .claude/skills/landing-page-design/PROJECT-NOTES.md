# landing-page-design — notas de este template

`SKILL.md` es la skill upstream **sin modificar**
([elayadesign/ai-design-skills](https://github.com/elayadesign/ai-design-skills) @ `1c1e97c`, MIT — ver `LICENSE`).

Cómo encaja con la landing scroll-world:

- **El hero ES el ScrollWorld.** La primera escena cumple "above the fold" (A2): su
  `title` es el H1 (outcome + audiencia), `body` el subheadline, `tags` la señal de prueba
  y la última escena lleva el CTA principal. No agregues un hero de Payload encima
  (`hero.type = none`).
- **Las secciones de la Parte A que no son escenas** (prueba social, objeciones, FAQ,
  pricing, CTA final) van como bloques de Payload **debajo** del ScrollWorld: `content`,
  `mediaBlock`, `faq`, `cta`, `archive`, `formBlock`.
- **Parte B (sistema visual)** aplica a esos bloques y al theme del mundo
  (Settings → Theme del bloque: `background`, `ink`, `inkSoft`, `accent`). Las tipografías
  se cargan en `src/app/(frontend)/layout.tsx`; los tokens de color en `globals.css`.
- **A7 (SEO y AEO)** está implementado en el template — ver `docs/seo-geo.md` y la skill
  `seo-geo-content`. No dupliques JSON-LD a mano.
