'use client'

/* ============================================================================
   ScrollWorld — scroll-scrubbed camera-flight engine (React port).

   Port of `scrub-engine.js` from github.com/oso95/scroll-world (MIT), adapted to:
   - render all DOM (and therefore all copy) in React, so it is SSR'd and indexable;
   - live INSIDE a page (sticky stage + scroll track) instead of owning the whole
     window, so normal Payload blocks (FAQ, blog archive, form…) can follow it;
   - reuse the site header instead of injecting its own top bar.
   Behaviour kept from upstream: interleaved dive/connector chain, blob-loaded clips
   (always seekable, no byte-range dependency), lazy prefetch, rAF-smoothed seeks,
   seam crossfades, per-scene `scroll` + `linger` pacing, reduced-motion fallback to
   stills, and phone hardening (mobile encodes, seek coalescing, iOS priming,
   poster-until-painted, ignore URL-bar-only resizes).
   ========================================================================== */

import React, { useEffect, useMemo, useRef } from 'react'

import { useHeaderTheme } from '@/providers/HeaderTheme'

import './scroll-world.css'

type CTA = {
  primary?: { label: string; href: string }
  secondary?: { label: string; href: string }
}

export type WorldSection = {
  id: string
  label: string
  accent?: string
  eyebrow?: string
  title: string
  body?: string
  tags?: string[]
  still?: string
  stillMobile?: string
  clip?: string
  clipMobile?: string
  scroll?: number
  linger?: number
  cta?: CTA
}

export type WorldConfig = {
  sections: WorldSection[]
  connectors: (string | null)[]
  connectorsMobile: (string | null)[]
  diveScroll: number
  connScroll: number
  crossfade: number
  hint: string
  showRoute: boolean
  showProgress: boolean
  atmosphere: boolean
  theme: { bg?: string; ink?: string; inkSoft?: string; accent?: string }
}

type Segment = {
  kind: 'dive' | 'conn'
  si: number
  clip?: string
  clipM?: string
  still?: string
  stillM?: string
  accent?: string
  w: number
  linger: number
}

const MOBILE_MQ = '(max-width: 860px)'
const COARSE_MQ = '(hover: none) and (pointer: coarse)'
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const smooth = (x: number) => {
  x = clamp(x)
  return x * x * (3 - 2 * x)
}
// Monotone remap: camera settles mid-scene (where the copy peaks); f(0)=0, f(1)=1 so
// seam frames are untouched.
const lingerEase = (x: number, L: number) => {
  L = clamp(L)
  const c = x - 0.5
  return (1 - L) * x + L * (4 * c * c * c + 0.5)
}
const pad = (n: number) => String(n).padStart(2, '0')
const isDark = (hex?: string) => {
  if (!hex) return false
  const h = hex.replace('#', '')
  const f =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5
}

function buildSegments(cfg: WorldConfig): Segment[] {
  const segs: Segment[] = []
  const N = cfg.sections.length
  cfg.sections.forEach((s, i) => {
    segs.push({
      kind: 'dive',
      si: i,
      clip: s.clip,
      clipM: s.clipMobile,
      still: s.still,
      stillM: s.stillMobile,
      accent: s.accent,
      w: s.scroll || cfg.diveScroll,
      linger: s.linger || 0,
    })
    // Optional connector: a missing slot means the two dives crossfade directly.
    if (i < N - 1 && cfg.connectors[i]) {
      const next = cfg.sections[i + 1]
      segs.push({
        kind: 'conn',
        si: i,
        clip: cfg.connectors[i] || undefined,
        clipM: cfg.connectorsMobile[i] || undefined,
        still: next.still,
        stillM: next.stillMobile,
        accent: next.accent,
        w: cfg.connScroll,
        linger: 0,
      })
    }
  })
  return segs
}

export const ScrollWorldClient: React.FC<{ config: WorldConfig; primary?: boolean }> = ({
  config,
  primary,
}) => {
  const segments = useMemo(() => buildSegments(config), [config])
  const totalW = useMemo(() => segments.reduce((a, s) => a + s.w, 0), [segments])
  const rootRef = useRef<HTMLElement>(null)
  const N = config.sections.length

  // When the world opens the page, the site header overlays it: pick the header theme
  // (light/dark text) from the world's background luminance.
  const { setHeaderTheme } = useHeaderTheme()
  useEffect(() => {
    if (!primary) return
    setHeaderTheme(isDark(config.theme.bg) ? 'dark' : 'light')
  }, [primary, config.theme.bg, setHeaderTheme])

  // Stable key so live preview / re-renders only restart the engine when content changes.
  const configKey = useMemo(() => JSON.stringify(config), [config])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia(COARSE_MQ).matches
    const smallMQ = window.matchMedia(MOBILE_MQ)
    const isMobile = () => coarse || smallMQ.matches

    const sceneEls = Array.from(root.querySelectorAll<HTMLElement>('.sw-scene'))
    const copyEls = Array.from(root.querySelectorAll<HTMLElement>('.sw-copy'))
    const dotEls = Array.from(root.querySelectorAll<HTMLElement>('.sw-route__dot'))
    const fill = root.querySelector<HTMLElement>('.sw-progress span')
    const hint = root.querySelector<HTMLElement>('.sw-hint')
    const particles = root.querySelector<HTMLElement>('.sw-particles')

    type Live = Segment & {
      el: HTMLElement
      img: HTMLImageElement | null
      video: HTMLVideoElement | null
      objectUrl?: string
      loading: boolean
      ready: boolean
      cur: number
      target: number
      visible: boolean
      start: number
      end: number
    }
    const S: Live[] = segments.map((s, i) => ({
      ...s,
      el: sceneEls[i],
      img: sceneEls[i]?.querySelector('img') ?? null,
      video: null,
      loading: false,
      ready: false,
      cur: 0,
      target: 0,
      visible: false,
      start: 0,
      end: 0,
    }))
    const diveOf = (si: number) => S.find((s) => s.kind === 'dive' && s.si === si)!

    // Swap to portrait posters on phones (chosen once at mount, like upstream).
    if (isMobile()) S.forEach((s) => s.img && s.stillM && (s.img.src = s.stillM))

    let vh = window.innerHeight
    let top = 0
    let stageX = 0
    let laidOutW = window.innerWidth
    let ticking = false
    let activeIndex = -1
    let rafId = 0
    let alive = true
    let userReady = false
    const fadeVh = config.crossfade

    function layout() {
      vh = window.innerHeight
      laidOutW = window.innerWidth
      stageX = window.innerWidth > 860 ? 4 : 0
      let off = 0
      S.forEach((s) => {
        s.start = off * vh
        off += s.w
        s.end = off * vh
      })
      // Pinned distance = track height; +1vh for the sticky viewport itself.
      root!.style.height = `${off * vh + vh}px`
      top = root!.getBoundingClientRect().top + window.scrollY
      read()
    }

    function primeVideo(v: HTMLVideoElement | null) {
      if (!isMobile() || !v) return
      try {
        const p = v.play()
        if (p?.then) p.then(() => v.pause()).catch(() => {})
      } catch {}
    }

    function loadClip(s: Live) {
      // Reduced motion: never load clips — stills cross-dissolve instead.
      if (reduce || s.loading || !s.clip) return
      s.loading = true
      const src = isMobile() && s.clipM ? s.clipM : s.clip
      fetch(src)
        .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
        .then((blob) => {
          if (!alive) return
          const v = document.createElement('video')
          v.className = 'sw-scene__video'
          v.muted = true
          v.playsInline = true
          v.preload = 'auto'
          v.setAttribute('muted', '')
          v.setAttribute('playsinline', '')
          v.setAttribute('aria-hidden', 'true')
          s.objectUrl = URL.createObjectURL(blob)
          v.src = s.objectUrl
          v.addEventListener('loadedmetadata', () => {
            s.ready = true
            read()
          })
          // Hide the poster only once a real frame painted (iOS stays blank otherwise).
          v.addEventListener('seeked', () => s.el.classList.add('has-clip'), { once: true })
          v.addEventListener('loadeddata', () => {
            try {
              v.pause()
            } catch {}
            if (userReady) primeVideo(v)
          })
          s.el.appendChild(v)
          s.video = v
        })
        .catch(() => {
          s.loading = false
        })
    }

    function read() {
      const y = window.scrollY - top
      const fade = fadeVh * vh
      let ci = 0
      for (let i = 0; i < S.length; i++) if (y >= S[i].start) ci = i

      for (let i = 0; i < S.length; i++) {
        const s = S[i]
        if (y > s.start - 1.6 * vh && y < s.end + 1.6 * vh) loadClip(s)
        const local = clamp((y - s.start) / (s.end - s.start))
        s.target = s.linger ? lingerEase(local, s.linger) : local
        let outside = 0
        if (y < s.start) outside = s.start - y
        else if (y > s.end) outside = y - s.end
        // First/last scenes stay fully visible before/after the chain.
        if ((i === 0 && y < s.start) || (i === S.length - 1 && y > s.end)) outside = 0
        const op = smooth(1 - outside / fade)
        s.el.style.opacity = String(op)
        s.visible = op > 0.001
        s.el.style.zIndex = i === ci ? '12' : String(Math.round(op * 10))
        if (s.img && (!s.video || !s.ready)) {
          const sc = reduce ? 1 : 1.03 + local * 0.14
          s.img.style.transform = `translateX(${stageX - 2}vw) scale(${sc.toFixed(3)})`
        }
      }

      for (let i = 0; i < N; i++) {
        const seg = diveOf(i)
        const pr = clamp((y - seg.start) / (seg.end - seg.start))
        const before = y < seg.start
        const after = y > seg.end
        let cop: number
        if (i === 0)
          cop = after ? 0 : smooth(1 - pr / 0.62) // greets on landing
        else if (i === N - 1)
          cop = before ? 0 : smooth(pr / 0.4) // holds the CTA
        else cop = before || after ? 0 : smooth(1 - Math.abs(pr - 0.5) / 0.5)
        const c = copyEls[i]
        if (!c) continue
        c.style.opacity = String(cop)
        c.style.transform = reduce ? 'none' : `translateY(${(0.5 - pr) * 4}vh)`
        c.style.pointerEvents = cop > 0.5 ? 'auto' : 'none'
        c.setAttribute('aria-hidden', cop > 0.5 ? 'false' : 'true')
      }

      const cur = S[ci]
      const near = clamp(
        cur.kind === 'dive'
          ? cur.si
          : (y - cur.start) / (cur.end - cur.start) > 0.5
            ? cur.si + 1
            : cur.si,
        0,
        N - 1,
      )
      if (near !== activeIndex) {
        activeIndex = near
        dotEls.forEach((d, k) => {
          d.classList.toggle('is-active', k === near)
          if (k === near) d.setAttribute('aria-current', 'step')
          else d.removeAttribute('aria-current')
        })
        const acc = config.sections[near]?.accent
        if (acc) root!.style.setProperty('--sw-accent', acc)
        else if (config.theme.accent) root!.style.setProperty('--sw-accent', config.theme.accent)
      }
      const total = S[S.length - 1].end
      if (fill) fill.style.transform = `scaleX(${clamp(y / total)})`
      if (hint) hint.style.opacity = String(clamp(1 - y / (0.5 * vh)))
      if (particles) particles.style.transform = `translate3d(0, ${-y * 0.05}px, 0)`
      ticking = false
    }

    function raf() {
      if (!alive) return
      const eps = isMobile() ? 0.02 : 0.008 // coarser seek step on phones = fewer decodes
      for (const s of S) {
        const v = s.video
        if (!v || !s.ready) continue
        // Never queue a seek while the decoder is still resolving the last one.
        if (v.seeking) continue
        if (!s.visible && Math.abs(s.cur - s.target) < 0.002) continue
        s.cur += (s.target - s.cur) * (reduce ? 1 : 0.18)
        const t = clamp(s.cur, 0, 0.999) * (v.duration || 1)
        if (Math.abs(v.currentTime - t) > eps) {
          try {
            v.currentTime = t
          } catch {}
        }
      }
      rafId = requestAnimationFrame(raf)
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(read)
      }
    }
    // Mobile URL-bar show/hide fires `resize`; relayout only when the width changes.
    const onResize = () => {
      if (coarse && window.innerWidth === laidOutW) return
      layout()
    }
    const onFirstGesture = () => {
      if (userReady) return
      userReady = true
      S.forEach((s) => primeVideo(s.video))
    }
    const jump = (e: Event) => {
      const i = Number((e.currentTarget as HTMLElement).dataset.index)
      const seg = diveOf(i)
      window.scrollTo({
        top: top + seg.start + (seg.end - seg.start) * 0.5,
        behavior: reduce ? 'auto' : 'smooth',
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', layout)
    window.addEventListener('load', layout)
    window.addEventListener('pointerdown', onFirstGesture, { once: true, passive: true })
    window.addEventListener('touchstart', onFirstGesture, { once: true, passive: true })
    dotEls.forEach((d) => d.addEventListener('click', jump))
    root.classList.add('is-live')
    layout()
    rafId = requestAnimationFrame(raf)

    return () => {
      alive = false
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', layout)
      window.removeEventListener('load', layout)
      window.removeEventListener('pointerdown', onFirstGesture)
      window.removeEventListener('touchstart', onFirstGesture)
      dotEls.forEach((d) => d.removeEventListener('click', jump))
      S.forEach((s) => {
        s.video?.remove()
        if (s.objectUrl) URL.revokeObjectURL(s.objectUrl)
        s.el?.classList.remove('has-clip')
      })
      root.classList.remove('is-live')
    }
    // configKey captures every config change; segments/N derive from it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey])

  const themeVars = {
    ...(config.theme.bg && { '--sw-bg': config.theme.bg }),
    ...(config.theme.ink && { '--sw-ink': config.theme.ink }),
    ...(config.theme.inkSoft && { '--sw-ink-soft': config.theme.inkSoft }),
    ...((config.sections[0]?.accent || config.theme.accent) && {
      '--sw-accent': config.sections[0]?.accent || config.theme.accent,
    }),
    // SSR height estimate (JS replaces it with exact px) to avoid layout shift.
    height: `calc(${(totalW + 1).toFixed(3)} * 100vh)`,
  } as React.CSSProperties

  return (
    <section
      ref={rootRef}
      className={primary ? 'sw-root is-primary' : 'sw-root'}
      style={themeVars}
      aria-roledescription="scroll story"
    >
      <div className="sw-sticky">
        <div className="sw-sky" aria-hidden="true">
          {config.atmosphere && (
            <>
              <div className="sw-sky__grad" />
              <div className="sw-sky__glow" />
              <Particles />
            </>
          )}
        </div>

        {config.showProgress && (
          <div className="sw-progress" aria-hidden="true">
            <span />
          </div>
        )}

        <div className="sw-stage" aria-hidden="true">
          {segments.map((s, i) => (
            <div
              key={i}
              className="sw-scene"
              style={{ ['--sw-accent' as string]: s.accent || undefined, opacity: i === 0 ? 1 : 0 }}
            >
              {s.still && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="sw-scene__still"
                  src={s.still}
                  alt=""
                  decoding="async"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : 'auto'}
                />
              )}
            </div>
          ))}
        </div>

        <div className="sw-copylayer">
          {config.sections.map((s, i) => {
            // The first scene's headline is the page <h1> when the world opens the page.
            const TitleTag = primary && i === 0 ? 'h1' : 'h2'
            return (
              <article
                key={s.id}
                id={s.id}
                className="sw-copy"
                style={{
                  ['--sw-accent' as string]: s.accent || undefined,
                  opacity: i === 0 ? 1 : 0,
                }}
              >
                <span className="sw-copy__num" aria-hidden="true">
                  {pad(i + 1)} / {pad(N)}
                </span>
                {s.eyebrow && <p className="sw-copy__eyebrow">{s.eyebrow}</p>}
                <TitleTag className="sw-copy__title">{s.title}</TitleTag>
                {s.body && <p className="sw-copy__body">{s.body}</p>}
                {!!s.tags?.length && (
                  <ul className="sw-copy__tags">
                    {s.tags.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
                {s.cta && (
                  <div className="sw-copy__cta">
                    {s.cta.primary && (
                      <a className="sw-btn sw-btn--primary" href={s.cta.primary.href}>
                        {s.cta.primary.label}
                      </a>
                    )}
                    {s.cta.secondary && (
                      <a className="sw-btn sw-btn--ghost" href={s.cta.secondary.href}>
                        {s.cta.secondary.label}
                      </a>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>

        {config.showRoute && (
          <nav className="sw-route" aria-label="Scenes">
            {config.sections.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`sw-route__dot${i === 0 ? ' is-active' : ''}`}
                data-index={i}
                style={{ ['--sw-accent' as string]: s.accent || undefined }}
                aria-label={s.label}
              >
                <span className="sw-route__label">{s.label}</span>
                <i />
              </button>
            ))}
          </nav>
        )}

        <div className="sw-hint" aria-hidden="true">
          <span>{config.hint}</span>
          <i />
        </div>
      </div>
    </section>
  )
}

const SEEDS = [
  7, 23, 41, 58, 71, 88, 12, 34, 52, 66, 83, 95, 18, 29, 47, 63, 77, 91, 5, 38, 55, 69, 82, 97,
]
const Particles: React.FC = () => (
  <div className="sw-particles">
    {Array.from({ length: 20 }, (_, k) => {
      const dur = 14 + (SEEDS[(k * 7) % SEEDS.length] % 22)
      return (
        <span
          key={k}
          className={`sw-pt sw-pt--${k % 3 === 2 ? 'ring' : 'dot'}`}
          style={
            {
              left: `${SEEDS[k % SEEDS.length]}vw`,
              top: `${(SEEDS[(k * 3) % SEEDS.length] * 1.3) % 100}vh`,
              '--sw-sc': (0.5 + ((SEEDS[(k * 5) % SEEDS.length] % 60) / 60) * 1.1).toFixed(2),
              animationDuration: `${dur}s`,
              animationDelay: `${-(SEEDS[(k * 2) % SEEDS.length] % dur)}s`,
            } as React.CSSProperties
          }
        />
      )
    })}
  </div>
)
