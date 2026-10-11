#!/usr/bin/env node
// Extract the seam frames needed to generate the next clips of the chain.
//
//   node scripts/world/frames.mjs world/<project>            # desktop chain
//   node scripts/world/frames.mjs world/<project> --mobile   # 9:16 chain
//
// Architecture B (dive + connector): for every pair i → i+1 writes
//   frames/seam_<i>_start.png  = LAST frame of dive i       (connector --start-image)
//   frames/seam_<i>_end.png    = FIRST frame of dive i+1    (connector --end-image)
// Architecture A (continuous legs): writes frames/leg_<i>_last.png, the
//   --start-image for leg i+1. Run it after each leg renders (legs are sequential).
//
// THE SEAM RULE: connector endpoints are ALWAYS the actual rendered frames,
// never the original stills. Using the stills produces a visible pop.
import fs from 'node:fs'
import path from 'node:path'
import { ensureDir, firstFrame, lastFrame, parseArgs, readWorld } from './lib.mjs'

const args = parseArgs(process.argv.slice(2))
const dir = args._[0]
if (!dir) {
  console.error('Usage: node scripts/world/frames.mjs world/<project> [--mobile]')
  process.exit(1)
}
const world = readWorld(dir)
const mobile = Boolean(args.mobile)
const key = mobile ? 'clipMobile' : 'clip'
const suffix = mobile ? '-m' : ''
const out = ensureDir(path.join(dir, 'frames'))
const sections = world.sections || []
const abs = (p) => (p ? path.join(dir, p) : null)

let written = 0
if (world.camera === 'walkthrough' || world.camera === 'locked-iso') {
  sections.forEach((s, i) => {
    const clip = abs(s[key])
    if (!clip || !fs.existsSync(clip)) return
    const dest = path.join(out, `leg_${i}_last${suffix}.png`)
    lastFrame(clip, dest)
    console.log(`leg ${i}: ${dest}`)
    written++
  })
} else {
  for (let i = 0; i < sections.length - 1; i++) {
    const a = abs(sections[i][key])
    const b = abs(sections[i + 1][key])
    if (!a || !b || !fs.existsSync(a) || !fs.existsSync(b)) {
      console.log(`seam ${i}: skipped (dive ${i} or ${i + 1} not rendered yet)`)
      continue
    }
    const start = path.join(out, `seam_${i}_start${suffix}.png`)
    const end = path.join(out, `seam_${i}_end${suffix}.png`)
    lastFrame(a, start)
    firstFrame(b, end)
    console.log(`seam ${i}: ${start}  →  ${end}`)
    written++
  }
}
console.log(`\n${written} frame set(s) written to ${out}`)
