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
 *                               the bone X, mouth EQ, eye blooms, title
 *
 * The mini card is the web build's mini player: the window shrinks to a
 * 320×365 card around the 620×622 face, and the shape is lifted so the card
 * is a plain rectangle while it is up.
 */
import framePlate from '../assets/skeleton-frame.webp'
import miniFace from '../assets/skeleton-mini-face.webp'
import { applySkinShape } from '../windowShape'
import { openLocalFiles } from '../openFiles'
import type { Skin } from './Skin'
import type { Player } from '../player/Player'

/** Full 3:2 stage and the 620:622 face card the window shrinks to. */
const STAGE_SIZE = { width: 960, height: 640, minWidth: 560, minHeight: 380 }
const MINI_SIZE = { width: 320, height: 365, minWidth: 320, minHeight: 365 }

/** Spectrum resolution — the web build's teeth line draws 24 bars */
const BAR_COUNT = 24
/** Bar colour, as in the web build's EQ strip */
const BAR_COLOR = '#38e5ff'
/** Playlist skull colours, taken from the web build's first rows */
const ROW_COLORS = ['#35e5ff', '#b3ef32', '#c397ff']

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
  miniTrack: HTMLElement
  miniBars: HTMLElement[]
  miniEyes: HTMLElement[]
}

export class SkeletonSkin implements Skin {
  readonly id = 'skeleton'
  readonly label = 'Skeleton'
  readonly shapeImage = framePlate
  /** 3:2, like the web build's stage — the plate is 1534×1025 */
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

  private durations = new Map<string, number>()
  private probed = new Set<string>()

  mount(player: Player): void {
    this.player = player
    const app = document.getElementById('app')!
    document.documentElement.dataset.skin = this.id

    this.container = document.createElement('div')
    this.container.className = 'skin skeleton-skin'
    this.container.style.setProperty('--sk-frame-url', `url("${framePlate}")`)
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

        <!-- Eye sockets = readout, driven by the jaw's energy -->
        <span class="sk-eye sk-eye-left" aria-hidden="true"></span>
        <span class="sk-eye sk-eye-right" aria-hidden="true"></span>

        <!-- Jaw = visualizer -->
        <canvas class="sk-viz" width="320" height="200" aria-hidden="true"></canvas>

        <!-- Pendant at the throat = play / pause -->
        <button class="sk-pendant" aria-label="Play" aria-pressed="false" title="Play / Pause"></button>

        <!-- Left bone arm = volume, and the speaker glyph at the channel's
             left end = mute. The plate's channel is blanked, so the glyph is
             drawn here (as in the web build) rather than painted on the art. -->
        <input class="sk-volume" type="range" min="0" max="100" step="1" value="80"
               aria-label="Volume" title="Volume" />
        <button class="sk-mute" aria-label="Mute" aria-pressed="false" title="Mute">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <path d="M6 18h8L26 8v32L14 30H6z" fill="#b7f5ff" stroke="#eaffff"
                  stroke-width="1.5" stroke-linejoin="round" />
            <path d="M32 16q8 8 0 16M37 10q13 14 0 28" fill="none" stroke="#66eaff"
                  stroke-width="3" stroke-linecap="round" />
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
        <button class="sk-prev" aria-label="Previous track" title="Previous track"></button>
        <button class="sk-next" aria-label="Next track" title="Next track"></button>

        <!-- Right bone arm = window tools, one per painted icon -->
        <button class="sk-tool sk-tool-minimize" aria-label="Minimize" title="Minimize">
          <span class="sk-tip" aria-hidden="true">Minimize</span>
        </button>
        <button class="sk-tool sk-tool-skin" aria-label="Change skin" title="Change skin">
          <span class="sk-tip" aria-hidden="true">Change skin</span>
        </button>
        <button class="sk-tool sk-tool-folder" aria-label="Open audio folder" title="Open audio folder">
          <span class="sk-tip" aria-hidden="true">Open audio folder</span>
        </button>
        <button class="sk-tool sk-tool-mini" aria-label="Mini version" title="Mini version">
          <span class="sk-tip" aria-hidden="true">Mini version</span>
        </button>
        <button class="sk-tool sk-tool-close" aria-label="Close player" title="Close player">
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
          <div class="sk-mini-info">
            <span class="sk-mini-track">—</span>
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
      miniTrack: c.querySelector('.sk-mini-track')!,
      miniBars: Array.from(c.querySelectorAll<HTMLElement>('.sk-mini-eq i')),
      miniEyes: Array.from(c.querySelectorAll<HTMLElement>('.sk-mini-eye')),
    }
    this.els = els

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
      els.miniTrack.textContent = track.title
      els.miniTrack.title = track.title
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
    window.setTimeout(() => void applySkinShape(framePlate), 60)
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

      const skull = document.createElement('span')
      skull.className = 'sk-skull'
      skull.textContent = '☠'

      const name = document.createElement('span')
      name.className = 'sk-row-name'
      name.textContent = `${String(i + 1).padStart(2, '0')}. ${track.title}`

      const time = document.createElement('span')
      time.className = 'sk-row-time'
      time.textContent = this.trackDuration(track.url)

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
    this.probeDurations()
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
   * The web build's spectrum: twenty-four bars standing on the teeth line,
   * each growing up from the bottom of its strip, capped with a white
   * hairline. The same energy sum drives the eye bloom through --eye.
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

    // 3% bars spread edge to edge, as the web build's justify-between strip
    const barWidth = w * 0.03
    const step = (w - barWidth) / (BAR_COUNT - 1)

    let energy = 0
    for (let i = 0; i < BAR_COUNT; i++) {
      let value: number
      if (playing && this.freqData) {
        const bin = Math.min(this.freqData.length - 1, i * 3 + 2)
        value = this.freqData[bin] / 255
      } else {
        // Idle bars keep breathing while paused
        value = 0.12 + 0.04 * Math.sin(now / 700 + i * 0.6)
      }
      this.smooth[i] += (value - this.smooth[i]) * 0.15
      energy += this.smooth[i]

      const height = (0.12 + this.smooth[i] * 0.88) * h
      const x = i * step
      ctx.fillStyle = BAR_COLOR
      ctx.shadowColor = BAR_COLOR
      ctx.shadowBlur = 6
      ctx.fillRect(x, h - height, barWidth, height)
      ctx.shadowBlur = 0
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x, h - height, barWidth, 2)
    }

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

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds)) return '--:--'
  const s = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function logPlayError(err: unknown): void {
  console.error('skinwalker: could not play track', err)
}
