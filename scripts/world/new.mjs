#!/usr/bin/env node
// Scaffold a new world working folder from world/_template.
//
//   pnpm world:new <project-slug>
import fs from 'node:fs'
import path from 'node:path'

const name = process.argv[2]
if (!name || !/^[a-z0-9-]+$/.test(name)) {
  console.error('Usage: pnpm world:new <project-slug>   (lowercase, digits, dashes)')
  process.exit(1)
}
const dest = path.resolve('world', name)
if (fs.existsSync(dest)) {
  console.error(`${dest} already exists`)
  process.exit(1)
}
fs.cpSync(path.resolve('world/_template'), dest, { recursive: true })
for (const d of ['stills', 'raw', 'frames', 'prompts'])
  fs.mkdirSync(path.join(dest, d), { recursive: true })
console.log(`Created ${dest}
Next:
  1. Fill world/${name}/BRIEF.md with the client interview (AGENTS.md → Fase 1)
  2. Edit world/${name}/world.json (sections, palette, camera, copy)
  3. Write prompts into world/${name}/prompts/ and generate stills/clips`)
