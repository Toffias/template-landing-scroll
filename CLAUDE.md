@AGENTS.md

## Claude Code

- Skills del proyecto en `.claude/skills/`: `scroll-landing` (playbook), `scroll-world`,
  `landing-page-design`, `seo-geo-content`, `payload` (referencia completa de Payload en
  `.claude/skills/payload/reference/`).
- MCP de Higgsfield declarado en `.mcp.json`. La primera vez Claude Code pide aprobar el
  servidor y abre el OAuth en el navegador; el usuario completa el login.
- Para ver la app: `.claude/launch.json` define el server `dev` (puerto 3000).
