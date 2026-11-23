/**
 * DraculaSkin — design flagship skin.
 *
 * Built on the updated web build's artwork: a full vampire in a velvet robe,
 * hands crossed low, the jeweled play medallion at the throat, with a baked
 * title, blood line and tracklist. Live controls sit on the painted anatomy
 * and the baked panels are covered by the live ones, as in the web build.
 *
 * Anatomy → control / readout:
 *   Eyes ───────────── readout: the sockets bloom with the track's RMS energy
 *   Medallion ──────── play / pause (a pause glyph covers the baked triangle)
 *   Title panel ────── live title + artist
 *   Blood line ─────── seek: live fill, drip curtain, elapsed / remaining
 *   Jeweled crosses ── volume: wide minus / tall plus at the line's ends
 *   Cape interior ──── mirrored spectrum: bars grow up and down from a centre
 *                      line, red→magenta→violet across the chest (dims while
 *                      the tool row is up)
 *   Crossed hands ──── prev / next
 *   Tracklist ──────── playlist rows with probed durations
 *   Tool row ───────── close, minimize, add files, next skin, mini bat (on hover)
 *   Bat ────────────── mini player: the window itself becomes the bat
 *
 * Every position in style.css is the web build's own stage percentage.
 */
import draculaFrameUrl from '../assets/dracula-frame.webp'
import draculaBatUrl from '../assets/dracula-bat.webp'
import draculaToolsUrl from '../assets/dracula-tools.jpg'
import draculaHandLeftUrl from '../assets/dracula-hand-glow-left.webp'
import draculaHandRightUrl from '../assets/dracula-hand-glow-right.webp'
import draculaMedallionFaceUrl from '../assets/dracula-medallion-face.webp'
import draculaVolMinusUrl from '../assets/dracula-vol-minus.webp'
import draculaVolPlusUrl from '../assets/dracula-vol-plus.webp'
import { applySkinShape } from '../windowShape'
import { openLocalFiles } from '../openFiles'
import type { Skin } from './Skin'
import type { Player } from '../player/Player'

/** Bars across the curtain. Fewer than the web build's 48 so each reads as a
 *  painted stripe rather than a hairline. */
const BAR_COUNT = 32
/** The curtain's band on the stage, in the plate's own percentages: a centre
 *  line between the blood line and the crossed hands, with every bar mirrored
 *  above and below it. style.css clips to the cape's inner oval, traced from
 *  the trim. */
type CurtainMode = 'mirror' | 'hang'

/** Which silhouette the curtain draws. 'mirror' grows every bar equally above
 *  and below a centre line; 'hang' starts every bar on one top line and runs
 *  it down, with the tail fading out. Both use the same reference profile, so
 *  the only difference between the two candidates is the anchoring. */
const CURTAIN_MODE: CurtainMode = 'mirror'

const CURTAIN = {
  left: 0.19,
  width: 0.62,
  // mirrored band: half-reach 0.12 puts the lobes on the trim at both ends
  centerY: 0.665,
  maxHalf: 0.12,
  // top-anchored curtain: bars start just under the times row and run to the
  // gold trim at the bottom of the chest (the clip's lowest point is 78.6%)
  topY: 0.556,
  maxLen: 0.3,
}

/** Reach profile sampled straight from the reference art: the centre bar is
 *  about 60% of the two round lobes just either side of it, and the reach eases
 *  down to ~62% at the ends. Values are the fraction of the full reach a bar
 *  is allowed at that distance from centre. */
const HEART_PROFILE: ReadonlyArray<readonly [number, number]> = [
  [0, 0.6],
  [0.08, 0.7],
  [0.18, 1],
  [0.3, 0.97],
  [0.45, 0.87],
  [0.6, 0.85],
  [0.75, 0.76],
  [0.9, 0.67],
  [1, 0.62],
]

/** Lower edge of the chest trim, sampled from the same polygon style.css
 *  clips with. Bars are capped here so a long one ends on the gold line with
 *  its own fade, instead of running into the clip and being sliced. */
const TRIM_BOTTOM: ReadonlyArray<readonly [number, number]> = [
  [49.5, 78.6],
  [58, 78.4],
  [69, 77.6],
  [74.8, 76.2],
  [77.6, 74.2],
  [78.5, 71.6],
  [79.2, 63.8],
]

function trimBottomPct(xPct: number): number {
  const x = xPct > 49.5 ? xPct : 99 - xPct
  for (let i = 1; i < TRIM_BOTTOM.length; i++) {
    const [x1, y1] = TRIM_BOTTOM[i]
    if (x <= x1) {
      const [x0, y0] = TRIM_BOTTOM[i - 1]
      return y0 + (y1 - y0) * ((x - x0) / (x1 - x0))
    }
  }
  return TRIM_BOTTOM[TRIM_BOTTOM.length - 1][1]
}

function heartProfile(d: number): number {
  for (let i = 1; i < HEART_PROFILE.length; i++) {
    const [d1, v1] = HEART_PROFILE[i]
    if (d <= d1) {
      const [d0, v0] = HEART_PROFILE[i - 1]
      return v0 + (v1 - v0) * ((d - d0) / (d1 - d0))
    }
  }
  return HEART_PROFILE[HEART_PROFILE.length - 1][1]
}
/** Curtain palette: ember red at the left shoulder, magenta through the
 *  middle, cold violet under the right, as on the reference plate. Stops are
 *  [bar position 0..1, rgb]. */
const SPECTRUM_STOPS: ReadonlyArray<readonly [number, readonly [number, number, number]]> = [
  [0.0, [236, 62, 28]],
  [0.2, [224, 44, 46]],
  [0.38, [201, 30, 92]],
  [0.55, [183, 40, 143]],
  [0.72, [160, 60, 190]],
  [0.86, [135, 84, 226]],
  [1.0, [110, 96, 242]],
]
/** Painted drop anchors on the blood strip, % of the seek width / height */
const DROP_X = [22.0, 30.2, 43.3, 57.0, 67.4, 77.0]
const DROP_Y = [34, 80, 46, 40, 50, 42]

/** The 2:3 stage, and the square bat the window shrinks to. */
const STAGE_SIZE = { width: 480, height: 720, minWidth: 380, minHeight: 560 }
const MINI_SIZE = { width: 380, height: 380, minWidth: 320, minHeight: 320 }

interface DraculaEls {
  title: HTMLElement
  artist: HTMLElement
  eyeLeft: HTMLElement
  eyeRight: HTMLElement
  canvas: HTMLCanvasElement
  seek: HTMLInputElement
  blood: HTMLElement
  elapsed: HTMLElement
  remaining: HTMLElement
  medallion: HTMLButtonElement
  miniPlay: HTMLButtonElement
  volDown: HTMLButtonElement
  volUp: HTMLButtonElement
  playlist: HTMLOListElement
  zone: HTMLElement
}

export class DraculaSkin implements Skin {
  readonly id = 'dracula'
  readonly label = 'Dracula'
  readonly shapeImage = draculaFrameUrl

  private container: HTMLElement | null = null
  private player: Player | null = null
  private els: DraculaEls | null = null
  private rafId = 0
  private mini = false

  private freqData: Uint8Array<ArrayBuffer> | null = null
  private waveData: Uint8Array<ArrayBuffer> | null = null
  private levels = new Float32Array(BAR_COUNT)
  private lastFrame = 0

  private seeking = false
  /** Kick envelope: fast attack, quick decay, so the curtain thumps. */
  private pulse = 0
  private activeIndex = -1
  /** Quantized eye glow, so the DOM only updates when the level moves */
  private eyeLevel = -1

  private durations = new Map<string, number>()
  private probed = new Set<string>()

  mount(player: Player): void {
    this.player = player
    this.mini = false
    // The analyser's default 0.8 smoothing blurs the spectrum over ~5 frames,
    // which leaves the curtain looking frozen on steady tracks. Dracula wants
    // the snap; the next skin gets the default back in unmount().
    player.audio.analyser.smoothingTimeConstant = 0.4
    const app = document.getElementById('app')!
    document.documentElement.dataset.skin = this.id

    this.container = document.createElement('div')
    this.container.className = 'skin dracula-skin'
    this.container.style.setProperty('--dr-frame-url', `url("${draculaFrameUrl}")`)
    this.container.style.setProperty('--dr-bat-url', `url("${draculaBatUrl}")`)
    this.container.style.setProperty('--dr-tools-url', `url("${draculaToolsUrl}")`)
    this.container.style.setProperty('--dr-hand-left-url', `url("${draculaHandLeftUrl}")`)
    this.container.style.setProperty('--dr-hand-right-url', `url("${draculaHandRightUrl}")`)
    this.container.style.setProperty('--dr-medallion-face-url', `url("${draculaMedallionFaceUrl}")`)
    this.container.style.setProperty('--dr-vol-minus-url', `url("${draculaVolMinusUrl}")`)
    this.container.style.setProperty('--dr-vol-plus-url', `url("${draculaVolPlusUrl}")`)
    this.container.innerHTML = this.template()
    app.innerHTML = ''
    app.appendChild(this.container)

    this.freqData = new Uint8Array(player.audio.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>
    this.waveData = new Uint8Array(128) as Uint8Array<ArrayBuffer>

    this.bindEvents()
    this.rafId = requestAnimationFrame(this.loop)
  }

  unmount(): void {
    cancelAnimationFrame(this.rafId)
    document.removeEventListener('pointerdown', this.onDocPointerDown)
    const player = this.player
    if (player) {
      player.onTrackChange = null
      player.audio.analyser.smoothingTimeConstant = 0.8
    }
    this.container?.remove()
    this.container = null
    this.els = null
    this.player = null
  }

  onPlaylistUpdate(): void {
    this.buildPlaylist()
    // Picked files append at the bottom, but the board is shorter than the
    // list — without this the new rows are scrolled out of sight.
    const list = this.els?.playlist
    if (list) list.scrollTop = list.scrollHeight
  }

  // ── DOM ──────────────────────────────────────────────────────────────────────

  private template(): string {
    return /* html */ `
      <div class="dr-body">

        <div class="dr-stage" aria-label="Dracula media player">

          <!-- Aura layers: soft halo + fine contour behind the plate -->
          <span class="dr-aura" aria-hidden="true"></span>
          <span class="dr-rim" aria-hidden="true"></span>
          <span class="dr-plate" aria-hidden="true"></span>

          <!-- Title panel = live title + subtitle over the baked pair -->
          <div class="dr-track-info">
            <span class="dr-title">—</span>
            <span class="dr-artist">—</span>
          </div>

          <!-- Eyes are a readout: these glows ride the painted sockets -->
          <span class="dr-eye dr-eye-left" aria-hidden="true"></span>
          <span class="dr-eye dr-eye-right" aria-hidden="true"></span>

          <!-- Medallion at the throat = play / pause -->
          <button class="dr-medallion" aria-label="Play" aria-pressed="false" title="Play / Pause">
            <span class="dr-pause-glyph" aria-hidden="true"></span>
          </button>

          <!-- Blood line = seek, bracketed by the jeweled volume crosses -->
          <div class="dr-seek-region" role="group" aria-label="Seek">
            <div class="dr-seek-top">
              <span class="dr-trackline" aria-hidden="true"></span>
              <div class="dr-blood" aria-hidden="true"></div>
              <button class="dr-vol dr-vol-down" aria-label="Volume down" title="Volume down">
                <span class="dr-vol-glyph" aria-hidden="true"></span>
              </button>
              <input class="dr-seek" type="range" min="0" max="1000" value="0"
                     aria-label="Seek through track" step="1" />
              <button class="dr-vol dr-vol-up" aria-label="Volume up" title="Volume up">
                <span class="dr-vol-glyph" aria-hidden="true"></span>
              </button>
            </div>
            <div class="dr-times">
              <span class="dr-elapsed">00:00</span>
              <span class="dr-remaining">-00:00</span>
            </div>
          </div>

          <!-- Cape interior = spectrum; hover reveals the tool row -->
          <div class="dr-zone" tabindex="0" role="group"
               aria-label="Player controls; hover, focus or click to reveal">
            <canvas class="dr-viz" aria-hidden="true"></canvas>
            <div class="dr-tools">
              <button class="dr-tool dr-tool-folder" aria-label="Add audio files" title="Add audio files"></button>
              <button class="dr-tool dr-tool-minimize" aria-label="Minimize" title="Minimize"></button>
              <button class="dr-tool dr-tool-close" aria-label="Close player" title="Close player"></button>
              <button class="dr-tool dr-tool-skin" aria-label="Next skin" title="Next skin"></button>
              <button class="dr-tool dr-tool-bat" aria-label="Mini bat player" title="Mini bat player"></button>
            </div>
          </div>

          <!-- Crossed hands = prev / next -->
          <button class="dr-prev" aria-label="Previous track" title="Previous track"></button>
          <button class="dr-next" aria-label="Next track" title="Next track"></button>

          <!-- Tracklist = playlist, covering the baked rows -->
          <ol class="dr-playlist" aria-label="Playlist"></ol>

        </div>

        <!-- Mini bat: the window shrinks to this plate -->
        <div class="dr-mini">
          <button class="dr-mini-close" aria-label="Close player" title="Close player"></button>
          <button class="dr-mini-play" aria-label="Play" aria-pressed="false" title="Play / Pause">
            <span class="dr-pause-glyph" aria-hidden="true"></span>
          </button>
          <button class="dr-mini-restore" aria-label="Back to the full player" title="Back to the full player"></button>
        </div>

      </div>
    `
  }

  // ── Events ───────────────────────────────────────────────────────────────────

  private bindEvents(): void {
    const c = this.container!
    const p = this.player!

    const els: DraculaEls = {
      title: c.querySelector('.dr-title')!,
      artist: c.querySelector('.dr-artist')!,
      eyeLeft: c.querySelector('.dr-eye-left')!,
      eyeRight: c.querySelector('.dr-eye-right')!,
      canvas: c.querySelector('.dr-viz')!,
      seek: c.querySelector('.dr-seek')!,
      blood: c.querySelector('.dr-blood')!,
      elapsed: c.querySelector('.dr-elapsed')!,
      remaining: c.querySelector('.dr-remaining')!,
      medallion: c.querySelector('.dr-medallion')!,
      miniPlay: c.querySelector('.dr-mini-play')!,
      volDown: c.querySelector('.dr-vol-down')!,
      volUp: c.querySelector('.dr-vol-up')!,
      playlist: c.querySelector('.dr-playlist')!,
      zone: c.querySelector('.dr-zone')!,
    }
    this.els = els

    this.buildDrops()

    // Medallion + mini bat play = play / pause
    const toggle = (): void => {
      p.togglePlayPause()
      this.updatePlayState()
    }
    els.medallion.addEventListener('click', toggle)
    els.miniPlay.addEventListener('click', toggle)

    // Seek: paint while dragging, commit on release (restarting the buffer on
    // every input event would stutter, as in the web version)
    els.seek.addEventListener('input', () => {
      this.seeking = true
      const dur = p.audio.duration
      const cur = dur * (Number(els.seek.value) / 1000)
      els.seek.style.setProperty('--progress', `${Number(els.seek.value) / 10}%`)
      els.blood.style.setProperty('--progress', `${Number(els.seek.value) / 10}%`)
      els.elapsed.textContent = fmt(cur)
      els.remaining.textContent = `-${fmt(Math.max(0, dur - cur))}`
    })
    els.seek.addEventListener('change', () => {
      p.seek(Number(els.seek.value) / 1000)
      this.seeking = false
    })

    // Volume → the jeweled minus / plus at the ends of the blood line
    const applyVolume = (v: number): void => {
      const vol = Math.min(1, Math.max(0, v))
      p.setVolume(vol)
      const pct = Math.round(vol * 100)
      const sync = (el: HTMLButtonElement, dir: string): void => {
        el.style.setProperty('--vol', String(vol))
        el.title = `Volume ${dir} — ${pct}%`
        el.setAttribute('aria-label', `Volume ${dir} (${pct}%)`)
      }
      sync(els.volDown, 'down')
      sync(els.volUp, 'up')
    }
    const stepVolume = (delta: number): void => applyVolume(p.currentVolume + delta)
    els.volDown.addEventListener('click', () => stepVolume(-0.05))
    els.volUp.addEventListener('click', () => stepVolume(0.05))
    for (const el of [els.volDown, els.volUp]) {
      el.addEventListener('wheel', (e) => {
        e.preventDefault()
        stepVolume(e.deltaY < 0 ? 0.05 : -0.05)
      }, { passive: false })
      el.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
          e.preventDefault()
          stepVolume(0.05)
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
          e.preventDefault()
          stepVolume(-0.05)
        }
      })
    }
    // Init from the player's volume so a mid-playback skin swap keeps it
    applyVolume(p.currentVolume)

    // Crossed hands → prev / next
    c.querySelector('.dr-prev')!.addEventListener('click', () => p.prev())
    c.querySelector('.dr-next')!.addEventListener('click', () => p.next())

    // Tool row: close, minimize, add files, next skin, mini bat. The web
    // build's fifth tool is a dead "coming soon" stub; here the mask cycles
    // the registry, so no visible control is a no-op.
    c.querySelector('.dr-tool-close')!.addEventListener('click', () => window.skinwalker?.close?.())
    c.querySelector('.dr-tool-minimize')!.addEventListener('click', () => window.skinwalker?.minimize?.())
    c.querySelector('.dr-tool-folder')!.addEventListener('click', () => void openLocalFiles(p))
    c.querySelector('.dr-tool-skin')!.addEventListener('click', () => p.nextSkin())
    c.querySelector('.dr-tool-bat')!.addEventListener('click', () => this.enterMini())
    c.querySelector('.dr-mini-restore')!.addEventListener('click', () => this.exitMini())
    c.querySelector('.dr-mini-close')!.addEventListener('click', () => window.skinwalker?.close?.())

    // Hover / focus reveal the tool row; a click on the cape pins it open
    els.zone.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('button')) return
      els.zone.classList.toggle('revealed')
    })
    els.zone.addEventListener('keydown', (e) => {
      if (e.target !== els.zone) return
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
      els.zone.classList.toggle('revealed')
    })
    document.addEventListener('pointerdown', this.onDocPointerDown)

    // Track change
    p.onTrackChange = (track, idx) => {
      els.title.textContent = track.title
      els.title.title = track.title
      els.artist.textContent = track.artist
      els.artist.title = track.artist
      this.activeIndex = idx
      this.highlightPlaylistItem(idx)
    }

    this.buildPlaylist()
  }

  private onDocPointerDown = (e: PointerEvent): void => {
    const zone = this.els?.zone
    if (!zone) return
    if (!(e.target as HTMLElement).closest('.dr-zone')) zone.classList.remove('revealed')
  }

  // ── Mini bat ─────────────────────────────────────────────────────────────────

  private enterMini(): void {
    if (!this.container || this.mini) return
    this.mini = true
    this.container.classList.add('mini-mode')
    this.els?.zone.classList.remove('revealed')
    window.skinwalker?.setWindowSize?.(MINI_SIZE)
    // Shape after the OS resize lands: the plate is square and the bat rects
    // sampled at the old (stage) size would be clipped into horizontal bands.
    window.setTimeout(() => void applySkinShape(draculaBatUrl), 60)
  }

  private exitMini(): void {
    if (!this.container || !this.mini) return
    this.mini = false
    this.container.classList.remove('mini-mode')
    window.skinwalker?.setWindowSize?.(STAGE_SIZE)
    window.setTimeout(() => void applySkinShape(draculaFrameUrl), 60)
  }

  // ── Playlist ─────────────────────────────────────────────────────────────────

  private buildDrops(): void {
    const host = this.container?.querySelector('.dr-blood')
    if (!host) return
    host.replaceChildren()
    DROP_X.forEach((x, i) => {
      const drop = document.createElement('span')
      drop.className = 'dr-blood-drop'
      drop.style.left = `${x}%`
      drop.style.top = `${DROP_Y[i]}%`
      drop.style.setProperty('--dw', `${0.38 + (i % 3) * 0.08}cqw`)
      drop.style.setProperty('--dh', `${0.62 + (i % 3) * 0.12}cqw`)
      drop.style.setProperty('--duration', `${3 + (i % 4) * 0.45}s`)
      drop.style.setProperty('--delay', `${-i * 0.71}s`)
      host.appendChild(drop)
    })
  }

  private buildPlaylist(): void {
    const p = this.player
    if (!p || !this.els) return
    const ol = this.els.playlist
    ol.replaceChildren()

    p.playlist.forEach((track, i) => {
      const li = document.createElement('li')
      li.className = 'dr-track'
      li.dataset.index = String(i)
      li.setAttribute('role', 'button')
      li.setAttribute('tabindex', '0')
      li.setAttribute('aria-label', `Play ${track.title}`)

      const name = document.createElement('span')
      name.className = 'dr-track-name'
      name.textContent = `${String(i + 1).padStart(2, '0')}. ${track.title}`

      const time = document.createElement('span')
      time.className = 'dr-track-time'
      time.textContent = `• ${this.trackDuration(track.url)}`

      li.append(name, time)
      li.addEventListener('click', () => void p.playIndex(i).catch(logPlayError))
      li.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        void p.playIndex(i).catch(logPlayError)
      })
      ol.appendChild(li)
    })

    this.highlightPlaylistItem(this.activeIndex)
    this.probeDurations()
  }

  private highlightPlaylistItem(idx: number): void {
    const ol = this.els?.playlist
    if (!ol || idx < 0) return
    ol.querySelectorAll('li').forEach((li, i) => {
      li.classList.toggle('active', i === idx)
      li.setAttribute('aria-current', i === idx ? 'true' : 'false')
    })
  }

  /** Read each track's duration with a throwaway <audio> so the playlist can
   *  show "• mm:ss" before the track has ever been decoded by the engine. */
  private probeDurations(): void {
    const p = this.player
    if (!p) return
    p.playlist.forEach((track) => {
      if (this.probed.has(track.url)) return
      this.probed.add(track.url)
      const probe = new Audio()
      probe.preload = 'metadata'
      probe.addEventListener('loadedmetadata', () => {
        if (Number.isFinite(probe.duration) && probe.duration > 0) {
          this.durations.set(track.url, probe.duration)
          this.buildPlaylist()
        }
        probe.src = ''
      }, { once: true })
      probe.addEventListener('error', () => { probe.src = '' }, { once: true })
      probe.src = track.url
    })
  }

  private trackDuration(url: string): string {
    const seconds = this.durations.get(url)
    return seconds ? fmt(seconds) : '--:--'
  }

  // ── RAF loop ─────────────────────────────────────────────────────────────────

  private loop = (now: number): void => {
    this.rafId = requestAnimationFrame(this.loop)
    if (!this.player || !this.els) return
    this.drawVisualizer(now)
    this.updateEyes()
    this.paintTime()
    this.updatePlayState()
  }

  private updatePlayState(): void {
    const playing = this.player?.audio.isPlaying ?? false
    const els = this.els
    if (!els) return
    if (els.medallion.classList.contains('playing') === playing) return
    for (const btn of [els.medallion, els.miniPlay]) {
      btn.classList.toggle('playing', playing)
      btn.setAttribute('aria-pressed', String(playing))
      btn.setAttribute('aria-label', playing ? 'Pause' : 'Play')
    }
  }

  /** The cape curtain from the reference plate: every bar is mirrored about a
   *  centre line through the chest and follows the reference's dome — tallest
   *  just off-centre, easing down toward the ends, a slight dip at the middle.
   *  Every bar fades out at its tips rather than ending on a hard cap, and the
   *  lengths come straight from the live signal, so the curtain drops to a
   *  hairline when nothing plays. Colour is one continuous left-to-right sweep
   *  (red → magenta → violet). */
  private drawVisualizer(now: number): void {
    const els = this.els
    const p = this.player
    if (!els || !p || !this.freqData) return

    const canvas = els.canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(1, Math.round(rect.width * dpr))
    const h = Math.max(1, Math.round(rect.height * dpr))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    ctx.clearRect(0, 0, w, h)

    const playing = p.audio.isPlaying
    if (playing) p.audio.getFrequencyData(this.freqData)

    // The bank only spans the range music occupies (bass up to ~4 kHz). The
    // top of the FFT is empty in real tracks, which is what left the middle of
    // the cape with nothing to show.
    const topBin = Math.max(4, Math.floor((this.freqData.length - 2) * 0.2))

    // One frame-wide loudness level. At silence it is 0, so the curtain falls
    // to a line; while music plays it lifts every bar, which keeps the middle
    // of the cape from vanishing under the bass and makes the whole sheet move.
    let overall = 0
    if (playing) {
      let sum = 0
      for (let b = 1; b <= topBin; b++) sum += this.freqData[b]
      overall = Math.min(1, sum / topBin / 130)
    }

    const delta = this.lastFrame ? Math.min(2.5, (now - this.lastFrame) / 16.67) : 1
    this.lastFrame = now

    // Kick envelope. The slow frame average left the wings pinned and the
    // notch almost still; a fast attack with a quick decay gives every bar a
    // beat to ride, including the short ones in the middle.
    let kick = 0
    if (playing) {
      for (let b = 1; b <= 6; b++) kick = Math.max(kick, this.freqData[b])
      kick /= 255
    }
    this.pulse += (kick - this.pulse) * (1 - Math.pow(1 - (kick > this.pulse ? 0.6 : 0.28), delta))

    // The canvas is stage-sized (style.css pulls it back over the whole
    // plate), so the curtain is laid out in the plate's own percentages and
    // the CSS clip follows the painted trim around it.
    const bandLeft = w * CURTAIN.left
    const bandW = w * CURTAIN.width
    const mirrored = CURTAIN_MODE === 'mirror'
    const centerY = h * CURTAIN.centerY
    const topY = h * CURTAIN.topY
    const maxExtent = h * (mirrored ? CURTAIN.maxHalf : CURTAIN.maxLen)
    const pitch = bandW / BAR_COUNT
    const barW = pitch * 0.8
    const half = (BAR_COUNT - 1) / 2
    const bars: Array<{ x: number; top: number; bottom: number; width: number; rgb: string }> = []

    for (let i = 0; i < BAR_COUNT; i++) {
      const x = bandLeft + (i + 0.5) * pitch
      // 0 at the cape's centre line, 1 at the wingtips. Heights are mirrored
      // about the centre, so the mass is one symmetrical bat.
      const d = Math.abs(i - half) / half

      // Bass under the wings, mids in the middle.
      const bin = Math.max(2, Math.min(topBin, Math.round(1 + Math.pow(1 - d, 1.25) * (topBin - 1))))

      // Buffer: a bar reads the strongest of a few bins around its own, so one
      // quiet FFT bin cannot leave it motionless. A max keeps the movement an
      // average would smooth away, and the frame pulse is mixed in so the
      // middle breathes even where the highs are thin.
      let energy = 0
      if (playing) {
        let band = 0
        for (let b = bin - 1; b <= bin + 1; b++) band = Math.max(band, this.freqData[b])
        energy = Math.pow(band / 255, 0.7)
      }

      // The reach each bar is allowed is the heart itself: a deep cleft at the
      // centre, round lobes, a taper out to the sides. The signal then moves
      // every bar inside that outline, so the silhouette stays a heart even
      // when the mix is compressed and all the bins sit near the ceiling.
      const envelope = heartProfile(d)
      // Headroom matters more than raw gain: with the old curve the wings sat
      // pinned at the ceiling and never pumped. 0.95 leaves them room to swing.
      const drive = 0.5 * energy + 0.45 * this.pulse + 0.05 * overall
      // A slow ripple travels along the curtain and keeps it breathing even on
      // a heavily compressed master where the bass barely leaves the ceiling.
      const breathe = 1
        + 0.05 * Math.sin(now * 0.0011 + i * 0.35)
        + 0.02 * Math.sin(now * 0.0027 + i * 0.9)
      const target = Math.min(1, drive * 0.95 * breathe)

      // Quick up, quick-ish down: a slow release held the notch almost still
      // between beats, which is what made the middle look frozen.
      const response = target > this.levels[i] ? 0.45 : 0.24
      this.levels[i] += (target - this.levels[i]) * (1 - Math.pow(1 - response, delta))

      // Mirrored: equal reach above and below the centre line. Hanging: the
      // bar starts on the shared top line and runs down. With no sound either
      // way leaves a hairline, and the bars widen to fill their column so the
      // line stays continuous.
      const reach = Math.max(h * 0.0018, this.levels[i] * maxExtent)
      const span = reach * envelope
      const top = mirrored ? centerY - span : topY
      // Hanging bars stop a hair above the painted trim; that cap is what lets
      // the tallest bar land on the gold line without the clip slicing it.
      const limit = mirrored ? Infinity : (trimBottomPct((x / w) * 100) / 100) * h - h * 0.001
      const bottom = mirrored ? centerY + span : Math.max(topY + h * 0.0018, Math.min(topY + span, limit))
      const merge = Math.min(1, this.levels[i] / 0.12)
      const drawnW = barW + (pitch - barW) * (1 - merge)
      const rgb = spectrumColor((i + 0.5) / BAR_COUNT)

      bars.push({ x, top, bottom, width: drawnW, rgb })
    }

    for (const bar of bars) {
      const rgb = bar.rgb
      const grad = ctx.createLinearGradient(0, bar.top, 0, bar.bottom)
      if (mirrored) {
        // Light pools just above the centre line and fades off both tips, so
        // no bar ends on a visible cut.
        grad.addColorStop(0, `rgba(${rgb}, 0.08)`)
        grad.addColorStop(0.2, `rgba(${rgb}, 0.72)`)
        grad.addColorStop(0.45, `rgba(${rgb}, 0.92)`)
        grad.addColorStop(0.62, `rgba(${rgb}, 0.78)`)
        grad.addColorStop(1, `rgba(${rgb}, 0)`)
      } else {
        // Bright where it leaves the top line, then a short tail fade so the
        // light lands on the gold trim instead of dissolving a finger short
        // of it — and so a clip at the trim can only ever bite the faint end.
        grad.addColorStop(0, `rgba(${rgb}, 0.95)`)
        grad.addColorStop(0.45, `rgba(${rgb}, 0.9)`)
        grad.addColorStop(0.9, `rgba(${rgb}, 0.45)`)
        grad.addColorStop(1, `rgba(${rgb}, 0)`)
      }

      // Each bar also throws its own soft halo into the haze, which keeps the
      // glow glued to the moving bars instead of floating as a flat tint.
      ctx.save()
      ctx.fillStyle = grad
      ctx.shadowColor = `rgba(${rgb}, 0.55)`
      ctx.shadowBlur = 20 * dpr
      ctx.fillRect(bar.x - bar.width / 2, bar.top, bar.width, bar.bottom - bar.top)
      ctx.restore()
    }
  }

  /** Eyes are a readout: the glow follows the real signal energy */
  private updateEyes(): void {
    const els = this.els
    const p = this.player
    if (!els || !p || !this.waveData) return

    const playing = p.audio.isPlaying
    let energy = 0
    if (playing) {
      p.audio.getWaveformData(this.waveData)
      let sum = 0
      for (let i = 0; i < this.waveData.length; i++) {
        const v = (this.waveData[i] - 128) / 128
        sum += v * v
      }
      energy = Math.sqrt(sum / this.waveData.length)
    }

    const glow = playing ? Math.min(0.9, 0.2 + energy * 6.5) : 0.15
    const quantized = Math.round(glow * 20) / 20
    if (quantized === this.eyeLevel) return
    this.eyeLevel = quantized
    for (const eye of [els.eyeLeft, els.eyeRight]) {
      eye.style.opacity = String(quantized)
      eye.style.setProperty('--eye', String(quantized))
    }
  }

  private paintTime(): void {
    const els = this.els
    const p = this.player
    if (!els || !p) return

    const dur = p.audio.duration
    const cur = Math.min(p.audio.currentTime, dur || 0)

    if (!this.seeking && dur > 0) {
      const value = String(Math.round((cur / dur) * 1000))
      if (els.seek.value !== value) els.seek.value = value
    }
    els.seek.style.setProperty('--progress', `${Number(els.seek.value) / 10}%`)
    els.blood.style.setProperty('--progress', `${Number(els.seek.value) / 10}%`)

    const elapsedText = fmt(cur)
    if (els.elapsed.textContent !== elapsedText) els.elapsed.textContent = elapsedText
    const remainingText = `-${fmt(Math.max(0, dur - cur))}`
    if (els.remaining.textContent !== remainingText) els.remaining.textContent = remainingText
  }
}

/** Interpolate the curtain palette at bar position t (0 = left, 1 = right). */
function spectrumColor(t: number): string {
  let i = 1
  while (i < SPECTRUM_STOPS.length - 1 && t > SPECTRUM_STOPS[i][0]) i++
  const [t0, c0] = SPECTRUM_STOPS[i - 1]
  const [t1, c1] = SPECTRUM_STOPS[i]
  const k = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)))
  const ch = c0.map((v, j) => Math.round(v + (c1[j] - v) * k))
  return `${ch[0]}, ${ch[1]}, ${ch[2]}`
}

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds)) return '--:--'
  const s = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function logPlayError(err: unknown): void {
  console.error('skinwalker: could not play track', err)
}
