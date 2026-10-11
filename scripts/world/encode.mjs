#!/usr/bin/env node
// Encode every clip referenced by world/<project>/world.json for smooth scrubbing,
// and derive poster stills from each clip's first frame.
//
//   node scripts/world/encode.mjs world/<project>
//
// Output: world/<project>/dist/*  +  dist/manifest.json (consumed by world:import).
// Desktop: native res, crf 20, GOP 8. Mobile (clipMobile / connectorsMobile): 720w, GOP 4.
// Never downscale the desktop master, never use all-intra (huge files) — the scrub
// engine loads clips as Blobs, so a small GOP is enough.
import fs from 'node:fs'
import path from 'node:path'
import {
  encodeDesktop,
  encodeMobile,
  ensureDir,
  parseArgs,
  poster,
  probe,
  readWorld,
} from './lib.mjs'

const args = parseArgs(process.argv.slice(2))
const dir = args._[0]
if (!dir) {
  console.error('Usage: node scripts/world/encode.mjs world/<project>')
  process.exit(1)
}
const world = readWorld(dir)
const dist = ensureDir(path.join(dir, 'dist'))
const abs = (p) => (p ? path.join(dir, p) : null)

function enc(src, name, mobile) {
  if (!src) return null
  const full = abs(src)
  if (!fs.existsSync(full)) {
    console.warn(`  ! missing ${src} — slot left empty`)
    return null
  }
  const dest = path.join(dist, `${name}${mobile ? '-m' : ''}.mp4`)
  ;(mobile ? encodeMobile : encodeDesktop)(full, dest)
  const p = probe(dest)
  const mb = (fs.statSync(dest).size / 1e6).toFixed(1)
  console.log(
    `  ✓ ${path.basename(dest)}  ${p.width}x${p.height}  ${p.duration.toFixed(1)}s  ${mb} MB`,
  )
  if (mobile && p.width > p.height) {
    console.warn(
      '    ! mobile clip is landscape — the mobile version should be a native 9:16 render',
    )
  }
  return path.relative(dir, dest).replaceAll('\\', '/')
}

const manifest = { ...world, sections: [], connectors: [], connectorsMobile: [] }

;(world.sections || []).forEach((s, i) => {
  const name = `${String(i + 1).padStart(2, '0')}-${s.id || 'scene'}`
  console.log(`Section ${name}`)
  const clip = enc(s.clip, name, false)
  const clipMobile = enc(s.clipMobile, name, true)
  // Poster = first frame of the encoded clip, so the still→video handoff is invisible.
  let still = null
  let stillMobile = null
  if (clip) {
    still = `dist/${name}.webp`
    poster(path.join(dir, clip), path.join(dir, still), 1920)
  } else if (s.still && fs.existsSync(abs(s.still))) {
    still = `dist/${name}.webp`
    poster(abs(s.still), path.join(dir, still), 1920)
  }
  if (clipMobile) {
    stillMobile = `dist/${name}-m.webp`
    poster(path.join(dir, clipMobile), path.join(dir, stillMobile), 720)
  }
  manifest.sections.push({ ...s, clip, clipMobile, still, stillMobile })
})

;(world.connectors || []).forEach((c, i) => {
  console.log(`Connector ${i}`)
  manifest.connectors.push(enc(c, `conn-${i + 1}`, false))
})
;(world.connectorsMobile || []).forEach((c, i) => {
  manifest.connectorsMobile.push(enc(c, `conn-${i + 1}`, true))
})

fs.writeFileSync(path.join(dist, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`\nManifest: ${path.join(dist, 'manifest.json')}`)
console.log(`Next: pnpm world:import ${dir}`)
