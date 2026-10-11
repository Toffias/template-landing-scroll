// Shared helpers for the scroll-world asset pipeline.
// Pure Node + ffmpeg/ffprobe so it runs the same on Windows, macOS and Linux
// (the upstream scroll-world skill ships bash scripts; these replace them here).
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

export function run(cmd, args, { quiet = false } = {}) {
  const res = spawnSync(cmd, args, { stdio: quiet ? 'pipe' : 'inherit', encoding: 'utf8' })
  if (res.error) throw new Error(`${cmd} not found or failed to start: ${res.error.message}`)
  if (res.status !== 0) {
    throw new Error(`${cmd} exited with ${res.status}\n${res.stderr || ''}`)
  }
  return res.stdout
}

export function ffmpeg(args) {
  return run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args])
}

export function probe(file) {
  const out = run(
    'ffprobe',
    [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height,r_frame_rate:format=duration',
      '-of',
      'json',
      file,
    ],
    { quiet: true },
  )
  const json = JSON.parse(out)
  const s = json.streams?.[0] || {}
  return { width: s.width, height: s.height, duration: Number(json.format?.duration || 0) }
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function readWorld(worldDir) {
  const file = path.join(worldDir, 'world.json')
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}. Copy world/_template first.`)
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

export function parseArgs(argv) {
  const out = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const next = argv[i + 1]
      if (next === undefined || next.startsWith('--')) out[key] = true
      else {
        out[key] = next
        i++
      }
    } else out._.push(a)
  }
  return out
}

/** Last frame of a clip (seek from the end — exact pixels for the next seam). */
export function lastFrame(src, dest) {
  ffmpeg(['-sseof', '-0.15', '-i', src, '-frames:v', '1', '-q:v', '2', '-update', '1', dest])
}

/** First frame of a clip. */
export function firstFrame(src, dest) {
  ffmpeg(['-ss', '0', '-i', src, '-frames:v', '1', '-q:v', '2', '-update', '1', dest])
}

/** Desktop scrub encode: native res, crf 20, GOP 8, no audio, faststart, light unsharp. */
export function encodeDesktop(src, dest) {
  ffmpeg([
    '-i',
    src,
    '-an',
    '-vf',
    'unsharp=5:5:0.8:5:5:0.0',
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '20',
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
}

/** Mobile scrub encode: 720 wide, crf 23, GOP 4 (cheaper seeks on phone decoders). */
export function encodeMobile(src, dest) {
  ffmpeg([
    '-i',
    src,
    '-an',
    '-vf',
    'scale=720:-2,unsharp=5:5:0.6:5:5:0.0',
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '23',
    '-pix_fmt',
    'yuv420p',
    '-g',
    '4',
    '-keyint_min',
    '4',
    '-sc_threshold',
    '0',
    '-movflags',
    '+faststart',
    dest,
  ])
}

/** Poster still (webp) from the clip's first frame — matches the video exactly. */
export function poster(src, dest, width) {
  const vf = width ? ['-vf', `scale=${width}:-2`] : []
  ffmpeg([
    '-ss',
    '0',
    '-i',
    src,
    '-frames:v',
    '1',
    ...vf,
    '-c:v',
    'libwebp',
    '-quality',
    '82',
    dest,
  ])
}
