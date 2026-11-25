/**
 * SkeletonSkin — the web build's neon skeleton, rebuilt as an image-frame skin.
 *
 * The plate (assets/skeleton-frame.webp) is the stage art from the Boba web
 * build: a neon skeleton with raised arms holding a bone-framed board. Its
 * near-black backdrop is cut to alpha, so the window is shaped like the
 * skeleton and its raised arms.
 *
 * Anatomy → control / readout (positions are the web build's own percentages
 * of its 3:2 stage, and this skin owns a 3:2 window, so the live elements land
 * on their painted counterparts):
 *   Pendant at the throat ────── play / pause (burns and breathes while playing)
 *   Teeth line in the jaw ────── live visualizer: 24 bars in the open mouth
 *   Eye sockets ─────────────── readout: the sockets bloom with the same energy
 *   Bone board overhead ─────── playlist, scrolling inside the bone frame
 *   Blood line ──────────────── seek: live fill, elapsed / remaining
 *   Left bone arm ───────────── volume (horizontal) and the speaker = mute
 *   Bone plaques ────────────── prev / next
 *   Title block ─────────────── live title + artist over the painted one
 *   Right bone arm ──────────── window tools, on the painted icon row:
 *                               skull → mini, half-mask → change skin,
 *                               coffin → open folder, bar → minimize, X → close
 *   Mini card ───────────────── 620×622 face card: play over the pendant,
 *                               restore over the ribcage badge, close over
 *                               the bone X, mouth EQ, eye blooms
 *
 * The mini card is the web build's mini player: the window shrinks to a
 * 340×351 card around the 620×622 face, with transparent margins so the
 * art is not cut by the window, and the shape is lifted so the card is a
 * plain rectangle while it is up.
 */
import framePlate from '../assets/skeleton-frame.webp'
import miniFace from '../assets/skeleton-mini-face.webp'
import toolMiniIcon from '../assets/skeleton-tool-mini.webp'
import toolSkinIcon from '../assets/skeleton-tool-skin.webp'
import toolFolderIcon from '../assets/skeleton-tool-folder.webp'
import toolMinimizeIcon from '../assets/skeleton-tool-minimize.webp'
import toolCloseIcon from '../assets/skeleton-tool-close.webp'
import rowSkullIcon from '../assets/skeleton-row-skull.png'
import { applySkinShape } from '../windowShape'
import { openLocalFiles } from '../openFiles'
import { formatTime as fmt, durationLabel, probeDurations } from '../trackDurations'
import type { Skin } from './Skin'
import type { Player } from '../player/Player'

/** Full 3:2 stage and the 620:622 face card the window shrinks to. */
const STAGE_SIZE = { width: 960, height: 640, minWidth: 560, minHeight: 380 }
/**
 * The plate asset is cropped to its painted art — 1177×975 taken from the
 * (178, 12) corner of the 1534×1025 stage it was cut from — while every
 * control below is positioned on that stage. The art is therefore drawn at
 * this inset inside the window, and the OS window shape is sampled from the
 * same inset, so the buttons keep landing on their painted counterparts.
 */
const PLATE_FRAME = {
  x: 178 / 1534,
  y: 12 / 1025,
  width: 1177 / 1534,
  height: 975 / 1025,
}
const MINI_SIZE = { width: 340, height: 351, minWidth: 340, minHeight: 351 }

/** Spectrum resolution — the web build's teeth line draws 24 bars */
const BAR_COUNT = 15
/** Bar colour, matched to the pendant's play glyph blue */
const BAR_COLOR = '#0af6ff'
/** Playlist skull colours, taken from the web build's first rows */
const ROW_COLORS = ['#35e5ff', '#b3ef32', '#c397ff']
/** Hue rotations that take the skull art's cyan to each row colour above, so the
 *  rows keep the web build's cyan / lime / violet rhythm. */
const ROW_HUES = ['0deg', '-102deg', '84deg']


interface SkeletonEls {
  body: HTMLElement
  track: HTMLElement
  artist: HTMLElement
  eyeGlowHost: HTMLElement
  canvas: HTMLCanvasElement
  seek: HTMLInputElement
  elapsed: HTMLElement
  remaining: HTMLElement
  pendant: HTMLButtonElement
  volume: HTMLInputElement
  mute: HTMLButtonElement
  playlist: HTMLOListElement
  miniPlay: HTMLButtonElement
  miniBars: HTMLElement[]
  miniEyes: HTMLElement[]
}

export class SkeletonSkin implements Skin {
  readonly id = 'skeleton'
  readonly label = 'Skeleton'
  readonly shapeImage = framePlate
  readonly shapeFrame = PLATE_FRAME
  /** 3:2, like the web build's stage — the frame every control sits on is
   *  1534×1025, and the plate asset is cropped inside it (see PLATE_FRAME) */
  readonly windowSize = { width: 960, height: 640 }

  private container: HTMLElement | null = null
  private player: Player | null = null
  private els: SkeletonEls | null = null
  private rafId = 0

  private freqData: Uint8Array<ArrayBuffer> | null = null
  private smooth = new Float32Array(BAR_COUNT)
  private eyeLevel = -1

  private seeking = false
  private activeIndex = -1
  private mini = false
  private muted = false
  private volumeBeforeMute = 0.8


  mount(player: Player): void {
    this.player = player
    const app = document.getElementById('app')!
    document.documentElement.dataset.skin = this.id

    this.container = document.createElement('div')
    this.container.className = 'skin skeleton-skin'
    this.container.style.setProperty('--sk-frame-url', `url("${framePlate}")`)
    // The plate layer's inset inside the 3:2 frame, from the same numbers the
    // window shape uses.
    const plate = this.container.style
    plate.setProperty('--sk-plate-x', `${PLATE_FRAME.x * 100}%`)
    plate.setProperty('--sk-plate-y', `${PLATE_FRAME.y * 100}%`)
    plate.setProperty('--sk-plate-w', `${PLATE_FRAME.width * 100}%`)
    plate.setProperty('--sk-plate-h', `${PLATE_FRAME.height * 100}%`)
    this.container.innerHTML = this.template()
    app.innerHTML = ''
    app.appendChild(this.container)

    this.freqData = new Uint8Array(
      player.audio.analyser.frequencyBinCount,
    ) as Uint8Array<ArrayBuffer>

    this.bindEvents()
    this.rafId = requestAnimationFrame(this.loop)
  }

  unmount(): void {
    cancelAnimationFrame(this.rafId)
    if (this.player) this.player.onTrackChange = null
    this.container?.remove()
    this.container = null
    this.els = null
    this.player = null
  }

  onPlaylistUpdate(): void {
    this.buildPlaylist()
    // Added rows land at the bottom of the board; show them.
    const list = this.els?.playlist
    if (list) list.scrollTop = list.scrollHeight
  }

  // ── DOM ──────────────────────────────────────────────────────────────────────

  private template(): string {
    const miniBars = '<i></i>'.repeat(BAR_COUNT)
    return /* html */ `
      <div class="sk-body" aria-label="Skeleton media player" style="--eye: 0.16">

        <!-- Raised arms hold the bone board = playlist -->
        <div class="sk-board" role="group" aria-label="Playlist">
          <ol class="sk-list"></ol>
        </div>

        <!-- The two corner skulls holding the board: their sockets light up
             while the playlist is hovered / focused (CSS :has, no JS) -->
        <span class="sk-board-eye" style="left: 25.6193%; top: 6.0488%" aria-hidden="true"></span>
        <span class="sk-board-eye" style="left: 27.2816%; top: 5.9512%" aria-hidden="true"></span>
        <span class="sk-board-eye" style="left: 72.6206%; top: 5.9512%" aria-hidden="true"></span>
        <span class="sk-board-eye" style="left: 74.2830%; top: 6.0488%" aria-hidden="true"></span>

        <!-- Eye sockets = readout, driven by the jaw's energy -->
        <span class="sk-eye sk-eye-left" aria-hidden="true"></span>
        <span class="sk-eye sk-eye-right" aria-hidden="true"></span>

        <!-- Jaw = visualizer -->
        <canvas class="sk-viz" width="320" height="200" aria-hidden="true"></canvas>

        <!-- Pendant at the throat = play / pause. The disc's own triangle was
             taken off the plate, so the glyph is drawn here and toggles to the
             pause bars while playing. -->
        <button class="sk-pendant" aria-label="Play" aria-pressed="false" title="Play / Pause">
          <span class="sk-pendant-glow" aria-hidden="true"></span>
          <svg class="sk-pendant-icon" viewBox="0 0 100 100" aria-hidden="true">
            <!-- Placed by its ink: the curve only reaches x 68.25 although its
                 Q control sits at 73.75, so the path is nudged right past its
                 own bounding-box centre — a triangle carries its mass in its
                 base, so the point sits a couple of units right of centre to
                 read as centred in the disc. -->
            <path class="sk-glyph sk-glyph-play"
                  d="M48.46 32.80 Q36.25 25.25 36.25 39.61 L36.25 60.39 Q36.25 74.75 48.46 67.20 L65.26 56.80 Q76.25 50 65.26 43.20 Z" />
            <g class="sk-glyph sk-glyph-pause">
              <rect x="31.75" y="25.25" width="12.5" height="49.5" rx="5" />
              <rect x="55.75" y="25.25" width="12.5" height="49.5" rx="5" />
            </g>
          </svg>
        </button>

        <!-- Left bone arm = volume, and the speaker glyph at the channel's
             left end = mute. The plate's channel is blanked, so the glyph is
             drawn here (as in the web build) rather than painted on the art. -->
        <input class="sk-volume" type="range" min="0" max="100" step="1" value="80"
               aria-label="Volume" title="Volume" />
        <button class="sk-mute" aria-label="Mute" aria-pressed="false" title="Mute">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <path class="sk-mute-cone" d="M7 17.5h8.6L26.4 7v34L15.6 30.5H7z" fill="#b7f5ff" stroke="#eaffff"
                  stroke-width="1.6" stroke-linejoin="round" />
            <path class="sk-mute-waves" d="M31.2 16.2q6.4 7.8 0 15.6M36.4 9.6q11 14.4 0 28.8" fill="none" stroke="#66eaff"
                  stroke-width="3.2" stroke-linecap="round" />
          </svg>
        </button>

        <!-- Title block = live title + artist -->
        <div class="sk-meta">
          <span class="sk-track">—</span>
          <span class="sk-artist">—</span>
        </div>

        <!-- Blood line = seek -->
        <input class="sk-seek" type="range" min="0" max="1000" value="0" step="1"
               aria-label="Seek through track" />
        <div class="sk-times">
          <span class="sk-elapsed">00:00</span>
          <span class="sk-remaining">-00:00</span>
        </div>

        <!-- Bone plaques = prev / next -->
        <button class="sk-prev" aria-label="Previous track"></button>
        <button class="sk-next" aria-label="Next track"></button>

        <!-- Right bone arm = window tools: the five glowing icons from the web
             build's controller sprite, on the plate's bare strip. -->
        <button class="sk-tool sk-tool-minimize" aria-label="Minimize" title="Minimize">
          <img class="sk-tool-icon" src="${toolMinimizeIcon}" alt="" draggable="false" />
          <span class="sk-tip" aria-hidden="true">Minimize</span>
        </button>
        <button class="sk-tool sk-tool-skin" aria-label="Change skin" title="Change skin">
          <img class="sk-tool-icon" src="${toolSkinIcon}" alt="" draggable="false" />
          <span class="sk-tip" aria-hidden="true">Change skin</span>
        </button>
        <button class="sk-tool sk-tool-folder" aria-label="Open audio folder" title="Open audio folder">
          <img class="sk-tool-icon" src="${toolFolderIcon}" alt="" draggable="false" />
          <span class="sk-tip" aria-hidden="true">Open audio folder</span>
        </button>
        <button class="sk-tool sk-tool-mini" aria-label="Mini version" title="Mini version">
          <img class="sk-tool-icon" src="${toolMiniIcon}" alt="" draggable="false" />
          <span class="sk-tip" aria-hidden="true">Mini version</span>
        </button>
        <button class="sk-tool sk-tool-close" aria-label="Close player" title="Close player">
          <img class="sk-tool-icon" src="${toolCloseIcon}" alt="" draggable="false" />
          <span class="sk-tip" aria-hidden="true">Close player</span>
        </button>


        <!-- Mini version = the web build's 620×622 face card -->
        <div class="sk-mini" role="complementary" aria-label="Mini player">
          <div class="sk-mini-face">
            <img class="sk-mini-art" src="${miniFace}" alt="" draggable="false" />
            <div class="sk-mini-eq" aria-hidden="true">${miniBars}</div>
            <i class="sk-mini-eye sk-mini-eye-left" aria-hidden="true"></i>
            <i class="sk-mini-eye sk-mini-eye-right" aria-hidden="true"></i>
            <button class="sk-mini-play" aria-label="Play" aria-pressed="false" title="Play / Pause">▶</button>
            <button class="sk-mini-restore" aria-label="Back to the full player" title="Back to the full player"></button>
            <button class="sk-mini-close" aria-label="Close player" title="Close player"></button>
          </div>
        </div>
      </div>
    `
  }

  // ── Events ───────────────────────────────────────────────────────────────────

  private bindEvents(): void {
    const c = this.container!
    const p = this.player!

    const els: SkeletonEls = {
      body: c.querySelector('.sk-body')!,
      track: c.querySelector('.sk-track')!,
      artist: c.querySelector('.sk-artist')!,
      eyeGlowHost: c.querySelector('.sk-body')!,
      canvas: c.querySelector('.sk-viz')!,
      seek: c.querySelector('.sk-seek')!,
      elapsed: c.querySelector('.sk-elapsed')!,
      remaining: c.querySelector('.sk-remaining')!,
      pendant: c.querySelector('.sk-pendant')!,
      volume: c.querySelector('.sk-volume')!,
      mute: c.querySelector('.sk-mute')!,
      playlist: c.querySelector('.sk-list')!,
      miniPlay: c.querySelector('.sk-mini-play')!,
      miniBars: Array.from(c.querySelectorAll<HTMLElement>('.sk-mini-eq i')),
      miniEyes: Array.from(c.querySelectorAll<HTMLElement>('.sk-mini-eye')),
    }
    this.els = els

    // The two skulls holding the board light their sockets while the playlist
    // is hovered. A class rather than :has() — the selector matched but the
    // style engine did not re-invalidate the sockets as the pointer moved.
    const board = c.querySelector<HTMLElement>('.sk-board')!
    board.addEventListener('pointerenter', () => els.body.classList.add('list-hover'))
    board.addEventListener('pointerleave', () => els.body.classList.remove('list-hover'))

    // Pendant → play / pause
    els.pendant.addEventListener('click', () => {
      p.togglePlayPause()
      this.updatePlayState()
    })

    // Seek: paint while dragging, commit on release — restarting the buffer on
    // every input event stutters, exactly as in the web build.
    els.seek.addEventListener('input', () => {
      this.seeking = true
      const dur = p.audio.duration
      const cur = dur * (Number(els.seek.value) / 1000)
      this.paintSeekUi(els.seek.value, cur, dur)
    })
    els.seek.addEventListener('change', () => {
      p.seek(Number(els.seek.value) / 1000)
      this.seeking = false
    })

    // Volume: the left bone arm's horizontal bar, and the painted speaker
    // beside it, which mutes without losing the level it was muted from.
    const syncMute = (): void => {
      els.mute.classList.toggle('muted', this.muted)
      // The arm's neon goes out while muted; the level itself is kept, so
      // unmuting relights the same run.
      els.volume.classList.toggle('muted', this.muted)
      els.mute.setAttribute('aria-pressed', String(this.muted))
      els.mute.setAttribute('aria-label', this.muted ? 'Unmute' : 'Mute')
      els.mute.title = this.muted ? 'Unmute' : 'Mute'
    }
    const applyVolume = (value: number): void => {
      const vol = Math.min(1, Math.max(0, value))
      p.setVolume(vol)
      els.volume.value = String(Math.round(vol * 100))
      els.volume.style.setProperty('--level', `${Math.round(vol * 100)}%`)
      els.volume.title = `Volume — ${Math.round(vol * 100)}%`
      els.volume.setAttribute('aria-valuetext', `${Math.round(vol * 100)}%`)
    }
    els.volume.addEventListener('input', () => {
      if (this.muted) {
        this.muted = false
        syncMute()
      }
      applyVolume(Number(els.volume.value) / 100)
    })
    els.mute.addEventListener('click', () => {
      if (this.muted) {
        this.muted = false
        applyVolume(this.volumeBeforeMute)
      } else {
        this.volumeBeforeMute = Number(els.volume.value) / 100
        this.muted = true
        p.setVolume(0)
      }
      syncMute()
    })
    // Start from the player's volume so a mid-playback swap never resets it
    applyVolume(p.currentVolume)
    syncMute()

    // Bone plaques → prev / next
    c.querySelector('.sk-prev')!.addEventListener('click', () => p.prev())
    c.querySelector('.sk-next')!.addEventListener('click', () => p.next())

    // Window tools → the five painted icons on the right arm. They are the web
    // build's own stubs; here each one does the desktop job.
    c.querySelector('.sk-tool-minimize')!.addEventListener('click', () => window.skinwalker?.minimize?.())
    c.querySelector('.sk-tool-skin')!.addEventListener('click', () => p.nextSkin())
    c.querySelector('.sk-tool-folder')!.addEventListener('click', () => void openLocalFiles(p))
    c.querySelector('.sk-tool-mini')!.addEventListener('click', () => this.enterMini())
    c.querySelector('.sk-tool-close')!.addEventListener('click', () => window.skinwalker?.close?.())

    // Mini card → play, restore, close
    els.miniPlay.addEventListener('click', () => {
      p.togglePlayPause()
      this.updatePlayState()
    })
    c.querySelector('.sk-mini-restore')!.addEventListener('click', () => this.exitMini())
    c.querySelector('.sk-mini-close')!.addEventListener('click', () => window.skinwalker?.close?.())

    // Track change
    p.onTrackChange = (track, idx) => {
      els.track.textContent = track.title
      els.track.title = track.title
      this.setArtist(track.artist)
      this.activeIndex = idx
      this.highlightPlaylistItem(idx)
    }

    this.buildPlaylist()
  }

  // ── Mini version ─────────────────────────────────────────────────────────────

  private enterMini(): void {
    if (!this.container || this.mini) return
    this.mini = true
    this.container.classList.add('mini-mode')
    window.skinwalker?.setWindowSize?.(MINI_SIZE)
    // The card is a rectangle, not the skeleton silhouette. Reshape after the
    // OS resize lands, as Dracula's bat does.
    window.setTimeout(() => void applySkinShape(undefined), 60)
  }

  private exitMini(): void {
    if (!this.container || !this.mini) return
    this.mini = false
    this.container.classList.remove('mini-mode')
    window.skinwalker?.setWindowSize?.(STAGE_SIZE)
    window.setTimeout(() => void applySkinShape(framePlate, PLATE_FRAME), 60)
  }

  /** Artist line with the web build's cyan bullet */
  private setArtist(text: string): void {
    const el = this.els?.artist
    if (!el) return
    el.replaceChildren()
    const parts = text.split('•')
    if (parts.length < 2) {
      el.textContent = text
      return
    }
    const bullet = document.createElement('b')
    bullet.textContent = '•'
    el.append(
      document.createTextNode(`${parts[0].trim()} `),
      bullet,
      document.createTextNode(` ${parts.slice(1).join('•').trim()}`),
    )
  }

  private buildPlaylist(): void {
    const p = this.player
    if (!p || !this.els) return
    const ol = this.els.playlist
    ol.replaceChildren()

    p.playlist.forEach((track, i) => {
      const row = document.createElement('li')
      row.className = 'sk-row'
      row.dataset.index = String(i)
      row.setAttribute('role', 'button')
      row.setAttribute('tabindex', '0')
      row.setAttribute('aria-label', `Play ${track.title}`)
      row.style.setProperty('--row', ROW_COLORS[i % ROW_COLORS.length])
      row.style.setProperty('--row-hue', ROW_HUES[i % ROW_HUES.length])

      const skull = document.createElement('span')
      skull.className = 'sk-skull'
      // The maintainer's row marker: the compact cyan skull from the reference.
      skull.innerHTML = /* html */ `<img src="${rowSkullIcon}" alt="" draggable="false" />`

      const name = document.createElement('span')
      name.className = 'sk-row-name'
      name.textContent = `${String(i + 1).padStart(2, '0')}. ${track.title}`

      const time = document.createElement('span')
      time.className = 'sk-row-time'
      time.textContent = durationLabel(track.url)

      row.append(skull, name, time)
      row.addEventListener('click', () => void p.playIndex(i).catch(logPlayError))
      row.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        void p.playIndex(i).catch(logPlayError)
      })
      ol.appendChild(row)
    })

    this.highlightPlaylistItem(this.activeIndex)
    probeDurations(this.player?.playlist ?? [], () => this.buildPlaylist())
  }

  private highlightPlaylistItem(idx: number): void {
    const ol = this.els?.playlist
    if (!ol || idx < 0) return
    ol.querySelectorAll<HTMLElement>('.sk-row').forEach((row, i) => {
      row.classList.toggle('active', i === idx)
      row.setAttribute('aria-current', i === idx ? 'true' : 'false')
      if (i === idx) row.scrollIntoView({ block: 'nearest' })
    })
  }

  /** Read each track's duration with a throwaway <audio> so the board can show
   *  a time before the engine has ever decoded that track. */

  // ── RAF loop ─────────────────────────────────────────────────────────────────

  private loop = (now: number): void => {
    this.rafId = requestAnimationFrame(this.loop)
    if (!this.player || !this.els) return
    this.drawVisualizer(now)
    this.paintTime()
    this.updatePlayState()
  }

  private updatePlayState(): void {
    const body = this.els?.body
    const pendant = this.els?.pendant
    if (!body || !pendant) return
    const playing = this.player?.audio.isPlaying ?? false
    if (body.classList.contains('playing') === playing) return
    body.classList.toggle('playing', playing)
    pendant.setAttribute('aria-pressed', String(playing))
    pendant.setAttribute('aria-label', playing ? 'Pause' : 'Play')
    const miniPlay = this.els?.miniPlay
    if (miniPlay) {
      miniPlay.textContent = playing ? 'Ⅱ' : '▶'
      miniPlay.classList.toggle('isPlaying', playing)
      miniPlay.setAttribute('aria-pressed', String(playing))
      miniPlay.setAttribute('aria-label', playing ? 'Pause' : 'Play')
    }
  }

  /**
   * The web build's spectrum: thin bars mirrored around a bright centre line
   * across the mouth. The same energy sum drives the eye bloom through --eye.
   */
  private drawVisualizer(now: number): void {
    const els = this.els
    const p = this.player
    if (!els || !p) return

    const ctx = els.canvas.getContext('2d')
    if (!ctx) return

    const playing = p.audio.isPlaying
    if (playing && this.freqData) p.audio.getFrequencyData(this.freqData)

    const w = 320
    const h = 200
    ctx.clearRect(0, 0, w, h)

    // Bars are mirrored about the centre line and spread edge to edge, the
    // way the web build's mouth EQ reads.
    const mid = h / 2
    // Keep the strip a hair off the mouth's walls. The canvas is clipped to the
    // cavity's oval, so the outer bars can run close to the edge and get cut by
    // the mouth itself instead of stopping short of it.
    const inset = w * 0.02
    const usable = w - inset * 2
    const slot = usable / BAR_COUNT
    // The mockup's bars leave only a narrow gap, so the strip reads as a band
    // rather than a row of ticks.
    const barWidth = slot * 0.54

    let energy = 0
    for (let i = 0; i < BAR_COUNT; i++) {
      let value: number
      if (playing && this.freqData) {
        const bin = Math.min(this.freqData.length - 1, i * 3 + 2)
        value = this.freqData[bin] / 255
      } else {
        // Idle bars keep breathing while paused, tall enough to read like
        // the web build's mouth strip instead of a flat line
        value = 0.34 + 0.2 * Math.sin(now / 700 + i * 0.75)
      }
      this.smooth[i] += (value - this.smooth[i]) * 0.15
      energy += this.smooth[i]

      // Elliptical envelope, held high across most of the span so the strip
      // reaches the mouth's corners: the clip cuts the last bars to the oval,
      // the way the mockup's bars run into the opening's edge.
      const t = i / (BAR_COUNT - 1)
      const envelope = Math.pow(Math.max(0, 1 - (t * 2 - 1) ** 2), 0.4)
      const half = (0.12 + this.smooth[i] * 0.88) * envelope * (mid - 4)
      const x = inset + i * slot + (slot - barWidth) / 2
      // No per-bar bloom: at this size the glows merged the gaps into one
      // solid strip.
      ctx.fillStyle = BAR_COLOR
      ctx.shadowBlur = 0
      ctx.fillRect(x, mid - half, barWidth, half * 2)
    }
    ctx.shadowBlur = 0

    // Mini card: the web build's mouth bars use the raw spectrum, 6% at rest.
    const freq = this.freqData
    let miniEnergy = 0
    els.miniBars.forEach((bar, i) => {
      const raw = playing && freq
        ? freq[Math.min(freq.length - 1, i * 3 + 2)] / 255
        : 0.04
      miniEnergy += raw
      bar.style.height = `${6 + raw * 94}%`
    })
    const miniEye = playing ? 0.2 + miniEnergy / 48 : 0.12
    for (const eyeEl of els.miniEyes) eyeEl.style.opacity = String(miniEye)

    const eye = playing ? Math.min(1, 0.3 + (energy / BAR_COUNT) * 1.9) : 0.2
    const quantized = Math.round(eye * 20) / 20
    if (quantized !== this.eyeLevel) {
      this.eyeLevel = quantized
      els.eyeGlowHost.style.setProperty('--eye', String(quantized))
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
    this.paintSeekUi(els.seek.value, cur, dur)

    const elapsedText = fmt(cur)
    if (els.elapsed.textContent !== elapsedText) els.elapsed.textContent = elapsedText
    const remainingText = `-${fmt(Math.max(0, dur - cur))}`
    if (els.remaining.textContent !== remainingText) els.remaining.textContent = remainingText
  }

  /** Paint the seek bar and its readout from one value. */
  private paintSeekUi(value: string, cur: number, dur: number): void {
    const els = this.els
    if (!els) return
    els.seek.value = value
    const progress = `${Number(value) / 10}%`
    els.seek.style.setProperty('--progress', progress)
    if (this.seeking) {
      els.elapsed.textContent = fmt(cur)
      els.remaining.textContent = `-${fmt(Math.max(0, dur - cur))}`
    }
  }
}


function logPlayError(err: unknown): void {
  console.error('skinwalker: could not play track', err)
}
