#!/usr/bin/env node
// Builds the procedural DEMO world (no AI credits needed) so the template runs and
// scrubs out of the box. It exercises the real pipeline end to end:
//   1. "dive" clips  → ffmpeg's mandelbrot source zooming into 3 different spots
//   2. seam frames   → frames.mjs logic (actual last/first rendered frames)
//   3. connectors    → built ONLY from those seam frames (start == dive i end,
//                      end == dive i+1 start), exactly like an AI connector would be
//   4. encode        → light demo encode, copied into src/endpoints/seed/world/
//
//   pnpm world:demo
//
// Replace all of this with real Higgsfield/Seedance renders for a client project
// (see AGENTS.md → "Flujo de un proyecto").
import fs from 'node:fs'
import path from 'node:path'
import { ensureDir, ffmpeg, firstFrame, lastFrame } from './lib.mjs'

const root = path.resolve('world/demo')
const raw = ensureDir(path.join(root, 'raw'))
const frames = ensureDir(path.join(root, 'frames'))
const seedDir = ensureDir(path.resolve('src/endpoints/seed/world'))
const W = 960
const H = 540
const FPS = 24
const DIVE_S = 6
const CONN_S = 3

const scenes = [
  { id: 'origen', x: -0.743643887037158, y: -0.131825904205311, hue: 200 },
  { id: 'proceso', x: -0.10109636384562, y: 0.95628651080914, hue: 20 },
  { id: 'producto', x: -1.25066, y: 0.02012, hue: 300 },
]

const look = (hue) => `hue=h=${hue}:s=0.85,gblur=sigma=0.6,eq=saturation=1.1`

console.log('1/4 dives')
scenes.forEach((s, i) => {
  const out = path.join(raw, `dive_${i}.mp4`)
  ffmpeg([
    '-f',
    'lavfi',
    '-i',
    `mandelbrot=size=${W}x${H}:rate=${FPS}:start_x=${s.x}:start_y=${s.y}:start_scale=2.6:end_scale=0.015:end_pts=${DIVE_S * FPS}:inner=period:outer=normalized_iteration_count`,
    '-t',
    String(DIVE_S),
    '-vf',
    look(s.hue),
    '-c:v',
    'libx264',
    '-crf',
    '16',
    '-pix_fmt',
    'yuv420p',
    out,
  ])
  console.log('  ✓', path.basename(out))
})

console.log('2/4 seam frames (actual rendered frames, never the stills)')
for (let i = 0; i < scenes.length - 1; i++) {
  lastFrame(path.join(raw, `dive_${i}.mp4`), path.join(frames, `seam_${i}_start.png`))
  firstFrame(path.join(raw, `dive_${i + 1}.mp4`), path.join(frames, `seam_${i}_end.png`))
}

console.log('3/4 connectors (frame-locked to both neighbours)')
const n = CONN_S * FPS
for (let i = 0; i < scenes.length - 1; i++) {
  const out = path.join(raw, `conn_${i}.mp4`)
  const half = CONN_S / 2
  // Push further in on the last frame of dive i, dissolve, then settle onto the exact
  // first frame of dive i+1 (z returns to 1 on the final frame).
  ffmpeg([
    '-loop',
    '1',
    '-t',
    String(CONN_S),
    '-i',
    path.join(frames, `seam_${i}_start.png`),
    '-loop',
    '1',
    '-t',
    String(CONN_S),
    '-i',
    path.join(frames, `seam_${i}_end.png`),
    '-filter_complex',
    `[0]zoompan=z='1+0.6*on/${n}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=${W}x${H}:fps=${FPS}[a];` +
      `[1]zoompan=z='1+0.6*(1-on/${n - 1})':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=${W}x${H}:fps=${FPS}[b];` +
      `[a][b]xfade=transition=fade:duration=${half}:offset=${half / 2},trim=duration=${CONN_S}[v]`,
    '-map',
    '[v]',
    '-c:v',
    'libx264',
    '-crf',
    '16',
    '-pix_fmt',
    'yuv420p',
    out,
  ])
  console.log('  ✓', path.basename(out))
}

console.log('4/4 demo encode → src/endpoints/seed/world')
const lite = (src, dest) =>
  ffmpeg([
    '-i',
    src,
    '-an',
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '27',
    '-pix_fmt',
    'yuv420p',
    '-g',
    '8',
    '-keyint_min',
    '8',
    '-sc_threshold',
    '0',
    '-movflags',
    '+faststart',
    dest,
  ])
scenes.forEach((s, i) => {
  lite(path.join(raw, `dive_${i}.mp4`), path.join(seedDir, `${s.id}.mp4`))
  ffmpeg([
    '-ss',
    '0',
    '-i',
    path.join(raw, `dive_${i}.mp4`),
    '-frames:v',
    '1',
    '-c:v',
    'libwebp',
    '-quality',
    '80',
    path.join(seedDir, `${s.id}.webp`),
  ])
})
for (let i = 0; i < scenes.length - 1; i++) {
  lite(path.join(raw, `conn_${i}.mp4`), path.join(seedDir, `conn-${i + 1}.mp4`))
}
for (const f of fs.readdirSync(seedDir)) {
  const kb = (fs.statSync(path.join(seedDir, f)).size / 1024).toFixed(0)
  console.log(`  ${f.padEnd(16)} ${kb} KB`)
}
console.log('\nDone. Run the seed from /admin (or pnpm seed) to load the demo landing.')
