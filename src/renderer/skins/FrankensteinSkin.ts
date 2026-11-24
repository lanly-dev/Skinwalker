/**
 * FrankensteinSkin — rebuilt on the reference web build (2026-11-23).
 *
 * The plate is a flat illustrated bust: the forehead is a block equalizer,
 * the monster's left eye follows the pointer, the right eye is play/pause,
 * the neck bolts change tracks, the stitched scar across the chest is the
 * seek line, the gold watch in the hand is volume, and five brass jacket
 * pins are the window tools. The plate leaves the mouth blank, so a riveted
 * mask closes it and the mask's cut-out is a working monitor: the playlist
 * runs in phosphor green on that screen, and that screen is the only copy
 * of the list — its rows are the playlist's keyboard path too.
 *
 * Anatomy → control / readout. Every position in style.css is the reference
 * build's own percentage of its 1280×1760 stage, and this skin's window is
 * that same 8:11 shape, so each live element lands on its painted
 * counterpart. The plate is cut 160px short of the reference's 2:3 art at the
 * chest, and the hand with the watch is lifted to the new bottom edge, so the
 * player is shorter than the reference without losing the fist:
 *   Forehead EQ ────── visualizer: 9 × 5 blocks, lit from the bottom
 *   Left eye ───────── readout: the iris follows the pointer, blinks, drifts
 *   Right eye ──────── play / pause (the glow holds while playing)
 *   Mouth mask ─────── MK-style half mask whose top edge rises into three
 *                      bolted points around the eye sockets; the CRT
 *                      playlist is its grille
 *   Neck bolts ─────── previous / next
 *   Stitched scar ──── seek: the bead rides the scar, progress fills it
 *   Gold watch ─────── volume: drag left/right, wheel, arrows; tap = mute
 *   Jacket pins ────── open folder, close, minimize, mini, next skin
 */
import framePlate from '../assets/frankenstein-frame.webp'
import knobPlate from '../assets/frankenstein-knob-plate.webp'
import knobFace from '../assets/frankenstein-knob-face.webp'
import { applySkinShape } from '../windowShape'
import { openLocalFiles } from '../openFiles'
import { formatTime as fmt, durationLabel, probeDurations } from '../trackDurations'
import type { Skin } from './Skin'
import type { Player } from '../player/Player'

/** 1280×1760 at 0.375 — the plate's own proportions, cropped at the chest. */
const STAGE_SIZE = { width: 480, height: 660, minWidth: 380, minHeight: 520 }
/** Mini keeps the whole figure, as the reference does — just smaller. */
const MINI_SIZE = { width: 320, height: 440, minWidth: 240, minHeight: 330 }

/** Forehead equalizer: the reference build's 9 × 5 block grid. */
const EQ_COLS = 9
const EQ_ROWS = 5
const EQ_CELL_W = 50
const EQ_CELL_H = 29
const EQ_BLOCK_W = 38
const EQ_BLOCK_H = 22
/** What the blocks show while paused, column by column. */
const EQ_IDLE = [4, 3, 5, 3, 5, 3, 5, 3, 4]

/** Stitched scar, in the plate's own 1280×1760 coordinates. */
const SCAR_PATH = 'M358 1174 C540 1134 751 1139 924 1090'

/** Horizontal pixels for the full 0–100 volume range. One window-width
 *  drag (480px) turns the knob from silent to full. */
const VOLUME_DRAG_PIXELS = 480

/** Jacket pin motifs, traced from the reference build's SVGs. */
const PIN_MOTIFS = {
  folder:
    'M16 29l5-10h13l5 6h16l-4 28H18z M17 33l7-7h29 M38 34v12q-7-3-8 2t8 1v-9l9-3v8q-6-2-6 2t6 1V33z',
  close: 'M24 18l29 29-6 6-29-29z M47 18l6 6-29 29-6-6z M23 23h1 M49 49h1 M49 23h1 M23 49h1',
  minimize: 'M36 16v24 M25 31l11 11 11-11 M18 50h36',
  mini: 'M19 19h34v33H19z M23 24h26 M39 32v6m-5 9v-7h10v7 M36 29h6 M25 30v15m-3-3 3 4 3-4',
  restore:
    'M19 19h34v33H19z M23 24h26 M30 31h12v16H30z M23 38v-8h8 M23 30l7 7 M49 39v9h-8 M49 48l-7-7',
  skin: 'M23 22l27 4-4 27-27-4z M28 17l27 4-1 23 M26 32q4-4 8 1m4 0q4-4 8 1 M28 42q7 6 14 0',
}

/** One brass pin: plate, engraved motif, sheen, green stud, hover label. */
function pinSvg(id: string, motif: string, label: string): string {
  return /* html */ `
    <svg viewBox="0 0 72 72" aria-hidden="true">
      <defs>
        <linearGradient id="fr-metal-${id}" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#fff2c0"/><stop offset=".18" stop-color="#d7b463"/>
          <stop offset=".36" stop-color="#99702f"/><stop offset=".48" stop-color="#f7d887"/>
          <stop offset=".67" stop-color="#b58636"/><stop offset="1" stop-color="#503617"/>
        </linearGradient>
      </defs>
      <path d="M6 24L18 8 53 7 66 24 64 55 50 66 18 63 7 49z" fill="#354c38"
            stroke="#b8aa7b" stroke-dasharray="3 4" stroke-width="2"/>
      <circle cx="36" cy="36" r="28" fill="url(#fr-metal-${id})" stroke="#604419" stroke-width="2"/>
      <circle cx="36" cy="36" r="23" fill="url(#fr-metal-${id})" stroke="#725322"/>
      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="${motif}" stroke="#59401f" stroke-width="2.5" transform="translate(.7 .9)"/>
        <path d="${motif}" stroke="#fff0b4" stroke-width="2.5"/>
      </g>
      <path d="M13 35A24 24 0 0 1 40 12 M18 25A21 21 0 0 1 33 16" fill="none"
            stroke="#fff2bd" stroke-width="1.4" opacity=".8"/>
      <path d="M14 48A26 26 0 0 0 59 36" fill="none" stroke="#4e351b" stroke-width="1.4"/>
      <circle cx="36" cy="60" r="3" fill="#8df879" stroke="#3c6f35"/>
    </svg>
    <span class="fr-pin-tip" aria-hidden="true">${label}</span>`
}

/** Short suture ticks crossing a quadratic seam, alternating lean — the mask,
 *  like the rest of the monster, is stitched together. */
function sutureTicks(
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  count: number,
): string {
  let d = ''
  for (let i = 0; i <= count; i++) {
    const t = i / count
    const mt = 1 - t
    const x = mt * mt * x0 + 2 * mt * t * cx + t * t * x1
    const y = mt * mt * y0 + 2 * mt * t * cy + t * t * y1
    const lean = i % 2 === 0 ? 5.5 : -5.5
    d += `M${(x - 4.2).toFixed(1)} ${(y + lean).toFixed(1)}L${(x + 4.2).toFixed(1)} ${(y - lean).toFixed(1)}`
  }
  return d
}

/**
 * The mouth mask: a below-the-eyes half mask, Mortal Kombat style — a dark
 * leather shell that follows the cheekbones and tapers to the chin, its top
 * edge rising into three bolted points around the two eye sockets (outer
 * corner, bridge, outer corner), a steel grille over nose and mouth,
 * stitched cheek and chin seams, studs.
 * The grille's opening is left empty here: the live playlist screen is an
 * HTML element placed exactly in it.
 *
 * Drawn in the mask's own 420×260 box, which is the same ratio as its CSS box
 * (44% × 19.85% of the 480×660 stage), so preserveAspectRatio="none" costs no
 * distortion and the screen's percentages line up with the grille.
 */
function mouthMaskSvg(): string {
  return /* html */ `
    <svg class="fr-mask-art" viewBox="0 0 420 260" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="fr-mask-leather" x1=".1" y1="0" x2=".9" y2="1">
          <stop stop-color="#4b564d"/><stop offset=".34" stop-color="#313b35"/>
          <stop offset=".72" stop-color="#1f2722"/><stop offset="1" stop-color="#121815"/>
        </linearGradient>
        <linearGradient id="fr-mask-steel" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#8d9a92"/><stop offset=".22" stop-color="#5b6861"/>
          <stop offset=".62" stop-color="#333d38"/><stop offset="1" stop-color="#161d1a"/>
        </linearGradient>
        <radialGradient id="fr-mask-bolt" cx=".34" cy=".3" r=".85">
          <stop stop-color="#e2eaef"/><stop offset=".5" stop-color="#939da5"/>
          <stop offset="1" stop-color="#20272c"/>
        </radialGradient>
      </defs>

      <!-- Leather shell: a below-the-eyes half mask, cheekbones to chin. Its top
           edge climbs into three points that track the two eye sockets — the
           outer corner of each socket and the bridge between them. -->
      <path d="M8 38 L42 0 Q78 30 110 38 L210 -5 Q242 30 310 38 L378 0 Q396 18 412 38
               C414 70 404 116 388 152 C372 194 320 244 210 254
               C100 244 48 194 32 152 C16 116 6 70 8 38 Z"
            fill="url(#fr-mask-leather)" stroke="#080b0d" stroke-width="3" stroke-linejoin="round"/>

      <!-- The three points, each bolted through its tab -->
      <g fill="url(#fr-mask-bolt)" stroke="#090d10" stroke-width="1">
        <circle cx="42" cy="10" r="4.4"/>
        <circle cx="210" cy="5" r="4.4"/>
        <circle cx="378" cy="10" r="4.4"/>
      </g>

      <!-- Cheek seams, stitched like the rest of him -->
      <path d="M22 46 Q13 110 28 168" fill="none" stroke="#cbb6a0" stroke-width="1.2" opacity=".32"/>
      <path d="${sutureTicks(22, 50, 13, 110, 27, 164, 9)}" stroke="#cbb6a0" stroke-width="2.2"
            stroke-linecap="round" opacity=".55"/>
      <path d="M398 46 Q407 110 392 168" fill="none" stroke="#cbb6a0" stroke-width="1.2" opacity=".32"/>
      <path d="${sutureTicks(398, 50, 407, 110, 393, 164, 9)}" stroke="#cbb6a0" stroke-width="2.2"
            stroke-linecap="round" opacity=".55"/>

      <!-- Studs in the cheek margin -->
      <g fill="url(#fr-mask-bolt)" stroke="#090d10" stroke-width=".9">
        <circle cx="28" cy="72" r="4.2"/><circle cx="40" cy="130" r="4.2"/>
        <circle cx="392" cy="72" r="4.2"/><circle cx="380" cy="130" r="4.2"/>
      </g>

      <!-- Bolted steel grille over nose and mouth; the live screen fills its
           opening (x 48–372, y 54–180) -->
      <path fill-rule="evenodd" fill="url(#fr-mask-steel)" stroke="#0a0e11" stroke-width="2.4"
            d="M30 44 L390 44 Q396 44 393 51 L352 188 Q349 197 340 195 Q276 206 210 206 Q144 206 80 195 Q71 197 68 188 L27 51 Q24 44 30 44 Z
               M74 54 H346 A26 26 0 0 1 372 80 V154 A26 26 0 0 1 346 180 H74 A26 26 0 0 1 48 154 V80 A26 26 0 0 1 74 54 Z"/>

      <!-- Bolted top and chin, so the grille reads as bolted plate metal -->
      <g fill="url(#fr-mask-bolt)" stroke="#090d10" stroke-width=".9">
        <circle cx="210" cy="49" r="4.2"/>
        <circle cx="106" cy="194" r="5"/><circle cx="314" cy="194" r="5"/>
      </g>

      <!-- Chin seam, stitched shut like everything else here -->
      <path d="M122 228 Q210 242 298 228" fill="none" stroke="#cbb6a0" stroke-width="1.3" opacity=".4"/>
      <path d="${sutureTicks(122, 228, 210, 242, 298, 228, 9)}" stroke="#cbb6a0" stroke-width="2.2"
            stroke-linecap="round" opacity=".6"/>
    </svg>`
}

interface FrEls {
  body: HTMLElement
  canvas: HTMLCanvasElement
  eye: HTMLElement
  iris: HTMLElement
  play: HTMLButtonElement
  seek: HTMLInputElement
  scarSvg: SVGSVGElement
  scarHit: SVGPathElement
  progress: SVGPathElement
  thumb: SVGCircleElement
  elapsed: HTMLElement
  remaining: HTMLElement
  dial: HTMLElement
  mute: HTMLButtonElement
  vol: HTMLOutputElement
  mouthList: HTMLOListElement
  mouthCount: HTMLElement
  minimizePin: HTMLButtonElement
  miniPin: HTMLButtonElement
}

export class FrankensteinSkin implements Skin {
  readonly id = 'frankenstein'
  readonly label = 'Frankenstein'
  readonly shapeImage = framePlate
  readonly windowSize = { width: 480, height: 660 }

  private container: HTMLElement | null = null
  private player: Player | null = null
  private els: FrEls | null = null
  private rafId = 0
  private eyeRaf = 0
  private mini = false

  private freqData: Uint8Array<ArrayBuffer> | null = null

  /** Seek: painted while dragging, committed on release — restarting the
   *  buffer on every pointer move stutters, as the other skins found. */
  private seeking = false
  private pendingSeek = 0
  private route: SVGPathElement | null = null
  private routeLength = 0
  private samples: Array<{ x: number; y: number }> = []

  private eyeX = 0
  private eyeY = 0
  private eyeLast = 0
  private pointerX = 0
  private pointerY = 0
  private pointerAt = 0

  private volumeBeforeMute = 0.8

  private activeIndex = -1

  mount(player: Player): void {
    this.player = player
    this.mini = false
    const app = document.getElementById('app')!
    document.documentElement.dataset.skin = this.id

    this.container = document.createElement('div')
    this.container.className = 'skin frankenstein-skin'
    this.container.style.setProperty('--fr-frame-url', `url("${framePlate}")`)
    this.container.innerHTML = this.template()
    app.innerHTML = ''
    app.appendChild(this.container)

    this.freqData = new Uint8Array(player.audio.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>

    this.bindEvents()
    this.buildScar()
    this.rafId = requestAnimationFrame(this.loop)
    this.eyeRaf = requestAnimationFrame(this.look)
  }

  unmount(): void {
    cancelAnimationFrame(this.rafId)
    cancelAnimationFrame(this.eyeRaf)
    document.removeEventListener('pointermove', this.onPointerAim)
    document.removeEventListener('pointerdown', this.onPointerAim)
    if (this.player) this.player.onTrackChange = null
    this.container?.remove()
    this.container = null
    this.els = null
    this.player = null
    this.route = null
    this.samples = []
  }

  onPlaylistUpdate(): void {
    this.buildPlaylist()
    // Added rows land at the bottom of the screen; show them.
    const list = this.els?.mouthList
    if (list) list.scrollTop = list.scrollHeight
  }

  // ── DOM ──────────────────────────────────────────────────────────────────────

  private template(): string {
    return /* html */ `
      <div class="fr-body" role="group" aria-label="Frankenstein media player">
        <span class="fr-plate" aria-hidden="true"></span>

        <!-- Forehead = visualizer -->
        <div class="fr-eq" aria-hidden="true">
          <canvas class="fr-viz" width="450" height="150"></canvas>
        </div>

        <!-- Left eye = living readout; right eye = play / pause -->
        <div class="fr-eye" aria-hidden="true"><span class="fr-iris"></span></div>
        <button class="fr-play" type="button" aria-label="Play track" aria-pressed="false"
                title="Play / pause">
          <span class="fr-play-symbol" aria-hidden="true"></span>
          <span class="fr-pause-symbol" aria-hidden="true"></span>
        </button>

        <!-- Mouth = a Mortal Kombat–style mask over the jaw. The plate has no
             mouth, so the mask covers it and its grille is a live monitor:
             the playlist lives on that screen, and these rows are the only
             copy of it — so they carry the keyboard path too. -->
        <div class="fr-mouth" role="group" aria-label="Playlist monitor">
          ${mouthMaskSvg()}
          <div class="fr-screen">
            <div class="fr-mouth-head" aria-hidden="true">
              <span>PLAYLIST</span>
              <span class="fr-mouth-count">—</span>
            </div>
            <ol class="fr-mouth-list" aria-label="Tracklist"></ol>
          </div>
        </div>

        <!-- Neck bolts = prev / next -->
        <button class="fr-bolt fr-prev" type="button" aria-label="Previous track"
                title="Previous track"></button>
        <button class="fr-bolt fr-next" type="button" aria-label="Next track"
                title="Next track"></button>

        <!-- Stitched scar = seek -->
        <div class="fr-scar">
          <svg class="fr-scar-svg" viewBox="0 0 1280 1760" aria-hidden="true">
            <path class="fr-scar-route" d="${SCAR_PATH}"/>
            <path class="fr-scar-progress" d="${SCAR_PATH}" pathLength="1000"/>
            <circle class="fr-scar-thumb" r="15"/>
            <path class="fr-scar-hit" d="${SCAR_PATH}"/>
          </svg>
          <input class="fr-seek" type="range" min="0" max="1000" value="0" step="1"
                 aria-label="Seek through track" />
          <div class="fr-times">
            <span class="fr-elapsed">00:00</span>
            <span class="fr-remaining">-00:00</span>
          </div>
        </div>

        <!-- Gold watch = volume; the dial face turns, a tap mutes -->
        <div class="fr-watch">
          <div class="fr-dial" role="slider" tabindex="0"
               aria-label="Volume dial: drag left or right, scroll, or use arrow keys"
               aria-valuemin="0" aria-valuemax="100" aria-valuenow="80">
            <img class="fr-knob-plate" src="${knobPlate}" alt="" draggable="false" />
            <img class="fr-knob-face" src="${knobFace}" alt="" draggable="false" />
          </div>
          <button class="fr-mute" type="button" aria-label="Mute" aria-pressed="false"
                  title="Mute / unmute">ϟ</button>
          <output class="fr-vol">80%</output>
        </div>

        <!-- Brass jacket pins = window tools. No title attributes: each pin
             draws its own hover/focus tip (the fr-pin-tip span), and the
             native tooltip would pop a second, slower copy of the same label. -->
        <button class="fr-pin fr-pin-folder" type="button"
                aria-label="Open folder">${pinSvg('folder', PIN_MOTIFS.folder, 'OPEN FOLDER')}</button>
        <button class="fr-pin fr-pin-close" type="button"
                aria-label="Close player">${pinSvg('close', PIN_MOTIFS.close, 'Close player')}</button>
        <button class="fr-pin fr-pin-minimize" type="button"
                aria-label="Minimize">${pinSvg('minimize', PIN_MOTIFS.minimize, 'Minimize')}</button>
        <button class="fr-pin fr-pin-mini" type="button"
                aria-label="Mini mode" aria-pressed="false">${pinSvg('mini', PIN_MOTIFS.mini, 'Mini mode')}</button>
        <button class="fr-pin fr-pin-skin" type="button"
                aria-label="Next skin">${pinSvg('skin', PIN_MOTIFS.skin, 'Next skin')}</button>

      </div>
    `
  }

  // ── Events ───────────────────────────────────────────────────────────────────

  private bindEvents(): void {
    const c = this.container!
    const p = this.player!

    const els: FrEls = {
      body: c.querySelector('.fr-body')!,
      canvas: c.querySelector('.fr-viz')!,
      eye: c.querySelector('.fr-eye')!,
      iris: c.querySelector('.fr-iris')!,
      play: c.querySelector('.fr-play')!,
      seek: c.querySelector('.fr-seek')!,
      scarSvg: c.querySelector('.fr-scar-svg')!,
      scarHit: c.querySelector('.fr-scar-hit')!,
      progress: c.querySelector('.fr-scar-progress')!,
      thumb: c.querySelector('.fr-scar-thumb')!,
      elapsed: c.querySelector('.fr-elapsed')!,
      remaining: c.querySelector('.fr-remaining')!,
      dial: c.querySelector('.fr-dial')!,
      mute: c.querySelector('.fr-mute')!,
      vol: c.querySelector('.fr-vol')!,
      mouthList: c.querySelector('.fr-mouth-list')!,
      mouthCount: c.querySelector('.fr-mouth-count')!,
      minimizePin: c.querySelector('.fr-pin-minimize')!,
      miniPin: c.querySelector('.fr-pin-mini')!,
    }
    this.els = els

    // Right eye = play / pause
    els.play.addEventListener('click', () => {
      p.togglePlayPause()
      this.updatePlayState()
    })

    // Neck bolts = prev / next
    c.querySelector('.fr-prev')!.addEventListener('click', () => p.prev())
    c.querySelector('.fr-next')!.addEventListener('click', () => p.next())

    this.bindSeek(els)
    this.bindVolume(els)

    // Jacket pins
    c.querySelector('.fr-pin-folder')!.addEventListener('click', () => void openLocalFiles(p))
    els.minimizePin.addEventListener('click', () => window.skinwalker?.minimize?.())
    c.querySelector('.fr-pin-close')!.addEventListener('click', () => window.skinwalker?.close?.())
    els.miniPin.addEventListener('click', () => {
      if (this.mini) this.exitMini()
      else this.enterMini()
    })
    c.querySelector('.fr-pin-skin')!.addEventListener('click', () => p.nextSkin())

    // The eye follows the pointer anywhere over the window
    document.addEventListener('pointermove', this.onPointerAim, { passive: true })
    document.addEventListener('pointerdown', this.onPointerAim, { passive: true })

    // Track change
    // The mouth monitor is now the only place the current track is named.
    p.onTrackChange = (_track, idx) => {
      this.activeIndex = idx
      this.highlightPlaylistItem(idx)
    }

    this.buildPlaylist()
    this.applyVolume(p.currentVolume)
  }

  private bindSeek(els: FrEls): void {
    const p = this.player!
    const hit = els.scarHit

    hit.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return
      e.preventDefault()
      this.seeking = true
      try {
        hit.setPointerCapture(e.pointerId)
      } catch {
        /* capture is a nicety; the window listeners still see the move */
      }
      els.seek.focus({ preventScroll: true })
      this.seekFromPointer(e)
    })
    hit.addEventListener('pointermove', (e) => {
      if (this.seeking) this.seekFromPointer(e)
    })
    const end = (): void => {
      if (!this.seeking) return
      this.seeking = false
      p.seek(this.pendingSeek)
    }
    hit.addEventListener('pointerup', end)
    hit.addEventListener('pointercancel', end)

    // Keyboard / assistive path: the range input is invisible but focusable.
    els.seek.addEventListener('input', () => {
      this.seeking = true
      const value = Number(els.seek.value)
      this.pendingSeek = value / 1000
      this.paintSeek(value)
      const dur = p.audio.duration
      const cur = dur * (value / 1000)
      els.elapsed.textContent = fmt(cur)
      els.remaining.textContent = `-${fmt(Math.max(0, dur - cur))}`
    })
    els.seek.addEventListener('change', () => {
      this.seeking = false
      p.seek(Number(els.seek.value) / 1000)
    })
  }

  private bindVolume(els: FrEls): void {
    const p = this.player!
    const dial = els.dial

    let pointer: number | null = null
    let startX = 0
    let startY = 0
    let startVolume = 0
    let moved = 0

    dial.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return
      e.preventDefault()
      pointer = e.pointerId
      startX = e.clientX
      startY = e.clientY
      startVolume = p.currentVolume
      moved = 0
      dial.focus({ preventScroll: true })
      try {
        dial.setPointerCapture(pointer)
      } catch {
        /* pointer capture is optional here */
      }
    })
    dial.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pointer) return
      const dx = e.clientX - startX
      moved = Math.max(moved, Math.hypot(dx, e.clientY - startY))
      this.applyVolume(startVolume + dx / VOLUME_DRAG_PIXELS)
    })
    const endDial = (e: PointerEvent): void => {
      if (e.pointerId !== pointer) return
      pointer = null
      try {
        dial.releasePointerCapture(e.pointerId)
      } catch {
        /* already released */
      }
      // A tap on the watch mutes, as in the reference build.
      if (moved < 3) this.toggleMute()
    }
    dial.addEventListener('pointerup', endDial)
    dial.addEventListener('pointercancel', (e) => {
      if (e.pointerId === pointer) pointer = null
    })
    dial.addEventListener('wheel', (e) => {
      e.preventDefault()
      const delta = e.deltaY || e.deltaX
      this.applyVolume(p.currentVolume - (delta * (e.deltaMode === 1 ? 2 : 0.15)) / 100)
    }, { passive: false })
    dial.addEventListener('keydown', (e) => {
      let value = p.currentVolume * 100
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') value += 2
      else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') value -= 2
      else if (e.key === 'Home') value = 0
      else if (e.key === 'End') value = 100
      else if (e.key === 'm' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        this.toggleMute()
        return
      } else return
      e.preventDefault()
      this.applyVolume(value / 100)
    })

    els.mute.addEventListener('click', () => this.toggleMute())
  }

  // ── Volume ───────────────────────────────────────────────────────────────────

  private applyVolume(value: number): void {
    const p = this.player
    const els = this.els
    if (!p || !els) return
    const vol = Math.min(1, Math.max(0, value))
    p.setVolume(vol)
    const pct = Math.round(vol * 100)
    els.dial.style.setProperty('--angle', `${-135 + vol * 270}deg`)
    els.dial.setAttribute('aria-valuenow', String(pct))
    els.dial.setAttribute('aria-valuetext', vol ? `${pct} percent` : 'Muted')
    els.dial.classList.toggle('muted', !vol)
    els.mute.classList.toggle('muted', !vol)
    els.mute.setAttribute('aria-pressed', String(!vol))
    els.mute.setAttribute('aria-label', vol ? 'Mute' : 'Unmute')
    els.mute.title = vol ? 'Mute / unmute' : 'Unmute'
    els.vol.textContent = `${pct}%`
  }

  private toggleMute(): void {
    const p = this.player
    if (!p) return
    if (p.currentVolume > 0) {
      this.volumeBeforeMute = p.currentVolume
      this.applyVolume(0)
    } else {
      this.applyVolume(this.volumeBeforeMute || 0.7)
    }
  }

  // ── Seek ─────────────────────────────────────────────────────────────────────

  private buildScar(): void {
    const route = this.container?.querySelector<SVGPathElement>('.fr-scar-route')
    if (!route) return
    this.route = route
    this.routeLength = route.getTotalLength()
    this.samples = []
    for (let i = 0; i <= 200; i++) {
      this.samples.push(route.getPointAtLength((this.routeLength * i) / 200))
    }
    this.paintSeek(0)
  }

  /** Nearest point on the scar to the pointer, as a 0–1000 value. */
  private seekFromPointer(e: PointerEvent): void {
    const els = this.els
    if (!els || !this.samples.length) return
    const ctm = els.scarSvg.getScreenCTM()
    if (!ctm) return
    const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    let best = 0
    let distance = Infinity
    this.samples.forEach((q, i) => {
      const d = (point.x - q.x) ** 2 + (point.y - q.y) ** 2
      if (d < distance) {
        distance = d
        best = i
      }
    })
    const value = (best / (this.samples.length - 1)) * 1000
    this.pendingSeek = value / 1000
    this.paintSeek(value)
    const dur = this.player?.audio.duration ?? 0
    const cur = dur * (value / 1000)
    els.elapsed.textContent = fmt(cur)
    els.remaining.textContent = `-${fmt(Math.max(0, dur - cur))}`
  }

  private paintSeek(value: number): void {
    const els = this.els
    if (!els || !this.route) return
    const v = Math.max(0, Math.min(1000, value))
    els.seek.value = String(Math.round(v))
    els.progress.setAttribute('stroke-dasharray', `${v} ${1000 - v}`)
    const point = this.route.getPointAtLength((this.routeLength * v) / 1000)
    els.thumb.setAttribute('cx', String(point.x))
    els.thumb.setAttribute('cy', String(point.y))
  }

  // ── Mini ─────────────────────────────────────────────────────────────────────

  private enterMini(): void {
    if (!this.container || this.mini) return
    this.mini = true
    this.container.classList.add('mini')
    window.skinwalker?.setWindowSize?.(MINI_SIZE)
    this.renderMiniPin()
    // Shape after the resize lands, as Dracula's bat does.
    window.setTimeout(() => void applySkinShape(framePlate), 60)
  }

  private exitMini(): void {
    if (!this.container || !this.mini) return
    this.mini = false
    this.container.classList.remove('mini')
    window.skinwalker?.setWindowSize?.(STAGE_SIZE)
    this.renderMiniPin()
    window.setTimeout(() => void applySkinShape(framePlate), 60)
  }

  private renderMiniPin(): void {
    const pin = this.els?.miniPin
    if (!pin) return
    const label = this.mini ? 'Restore full player' : 'Mini mode'
    pin.innerHTML = pinSvg('mini', this.mini ? PIN_MOTIFS.restore : PIN_MOTIFS.mini, label)
    pin.setAttribute('aria-label', label)
    pin.setAttribute('aria-pressed', String(this.mini))
  }

  // ── Playlist ─────────────────────────────────────────────────────────────────

  private buildPlaylist(): void {
    const p = this.player
    const els = this.els
    if (!p || !els) return

    this.fillList(els.mouthList)
    els.mouthCount.textContent = String(p.playlist.length).padStart(2, '0')

    this.highlightPlaylistItem(this.activeIndex)
    probeDurations(this.player?.playlist ?? [], () => this.buildPlaylist())
  }

  /** Renders the mouth monitor's track list. Its rows are the playlist's
   *  only UI, so each one is a button in the tab order and plays the track
   *  on click or on Enter / Space. */
  private fillList(ol: HTMLOListElement): void {
    const p = this.player
    if (!p) return
    ol.replaceChildren()

    p.playlist.forEach((track, i) => {
      const li = document.createElement('li')
      li.className = 'fr-mouth-row'
      li.dataset.index = String(i)
      li.setAttribute('role', 'button')
      li.setAttribute('tabindex', '0')
      li.setAttribute('aria-label', `Play ${track.title}`)

      const num = document.createElement('span')
      num.className = 'fr-track-num'
      num.textContent = String(i + 1).padStart(2, '0')

      const name = document.createElement('span')
      name.className = 'fr-track-name'
      name.textContent = track.title

      const time = document.createElement('span')
      time.className = 'fr-track-time'
      time.textContent = durationLabel(track.url)

      li.append(num, name, time)
      li.addEventListener('click', () => void p.playIndex(i).catch(logPlayError))
      li.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        void p.playIndex(i).catch(logPlayError)
      })
      ol.appendChild(li)
    })
  }

  private highlightPlaylistItem(idx: number): void {
    const ol = this.els?.mouthList
    if (!ol || idx < 0) return
    ol.querySelectorAll<HTMLElement>('.fr-mouth-row').forEach((row, i) => {
      row.classList.toggle('active', i === idx)
      row.setAttribute('aria-current', i === idx ? 'true' : 'false')
      // Keep the live row in view on the screen.
      if (i === idx) row.scrollIntoView({ block: 'nearest' })
    })
  }

  /** Read each track's duration with a throwaway <audio> so the screen can
   *  show a time before the engine has ever decoded that track. */

  // ── RAF loops ────────────────────────────────────────────────────────────────

  private loop = (): void => {
    this.rafId = requestAnimationFrame(this.loop)
    if (!this.player || !this.els) return
    this.drawVisualizer()
    this.paintTime()
    this.updatePlayState()
  }

  /** The iris follows the pointer and drifts on its own after a while. */
  private look = (now: number): void => {
    this.eyeRaf = requestAnimationFrame(this.look)
    const els = this.els
    if (!els) return
    const rect = els.eye.getBoundingClientRect()
    if (rect.width === 0) return

    let tx: number
    let ty: number
    if (now - this.pointerAt > 4500) {
      tx = Math.sin(now * 0.00043) * rect.width * 0.09
      ty = Math.sin(now * 0.00061) * rect.height * 0.07
    } else {
      const dx = this.pointerX - rect.left - rect.width / 2
      const dy = this.pointerY - rect.top - rect.height / 2
      const n = Math.max(80, Math.hypot(dx, dy))
      tx = (dx / n) * rect.width * 0.17
      ty = (dy / n) * rect.height * 0.15
    }
    const dt = Math.min(50, now - (this.eyeLast || now - 16))
    this.eyeLast = now
    const ease = 1 - Math.exp(-dt / 85)
    this.eyeX += (tx - this.eyeX) * ease
    this.eyeY += (ty - this.eyeY) * ease
    els.iris.style.transform = `translate(${this.eyeX.toFixed(2)}px, ${this.eyeY.toFixed(2)}px)`
  }

  private onPointerAim = (e: PointerEvent): void => {
    this.pointerX = e.clientX
    this.pointerY = e.clientY
    this.pointerAt = performance.now()
  }

  private updatePlayState(): void {
    const els = this.els
    const p = this.player
    if (!els || !p) return
    const playing = p.audio.isPlaying
    if (els.body.classList.contains('playing') === playing) return
    els.body.classList.toggle('playing', playing)
    els.play.setAttribute('aria-pressed', String(playing))
    els.play.setAttribute('aria-label', playing ? 'Pause track' : 'Play track')
    els.play.title = playing ? 'Pause track' : 'Play track'
  }

  /** The reference build's forehead equalizer: nine columns of five blocks,
   *  lit from the bottom by the real spectrum. */
  private drawVisualizer(): void {
    const els = this.els
    const p = this.player
    if (!els || !p) return
    const canvas = els.canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (canvas.width !== 450 || canvas.height !== 150) {
      canvas.width = 450
      canvas.height = 150
    }
    ctx.clearRect(0, 0, 450, 150)

    const playing = p.audio.isPlaying
    if (playing && this.freqData) p.audio.getFrequencyData(this.freqData)

    for (let i = 0; i < EQ_COLS; i++) {
      let lit = EQ_IDLE[i]
      if (playing && this.freqData) {
        const bin = Math.min(this.freqData.length - 1, 1 + i * 3)
        lit = Math.max(1, Math.round((this.freqData[bin] / 255) * EQ_ROWS))
      }
      for (let j = 0; j < EQ_ROWS; j++) {
        const on = j < lit
        ctx.fillStyle = on ? '#85ff72' : '#84ff7220'
        ctx.shadowColor = '#65ff50'
        ctx.shadowBlur = on ? 7 : 0
        ctx.beginPath()
        ctx.roundRect(i * EQ_CELL_W + 4, 150 - (j + 1) * EQ_CELL_H, EQ_BLOCK_W, EQ_BLOCK_H, 5)
        ctx.fill()
      }
    }
    ctx.shadowBlur = 0
  }

  private paintTime(): void {
    const els = this.els
    const p = this.player
    if (!els || !p) return

    const dur = p.audio.duration
    const cur = Math.min(p.audio.currentTime, dur || 0)
    if (!this.seeking) this.paintSeek(dur > 0 ? (cur / dur) * 1000 : 0)

    const elapsedText = fmt(cur)
    if (els.elapsed.textContent !== elapsedText) els.elapsed.textContent = elapsedText
    const remainingText = `-${fmt(Math.max(0, dur - cur))}`
    if (els.remaining.textContent !== remainingText) els.remaining.textContent = remainingText
  }
}


function logPlayError(err: unknown): void {
  console.error('skinwalker: could not play track', err)
}
