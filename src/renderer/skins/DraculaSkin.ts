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
 *   Speakers ───────── volume at the painted speakers ending the line
 *   Cape interior ──── mirrored spectrum (dims while the tool row is up)
 *   Crossed hands ──── prev / next
 *   Tracklist ──────── playlist rows with probed durations
 *   Tool row ───────── close, minimize, add files, mini bat (on hover)
 *   Bat ────────────── mini player: the window itself becomes the bat
 *
 * Every position in style.css is the web build's own stage percentage.
 */
import draculaFrameUrl from '../assets/dracula-frame.webp'
import draculaBatUrl from '../assets/dracula-bat.webp'
import draculaToolsUrl from '../assets/dracula-tools.jpg'
import { applySkinShape } from '../windowShape'
import { openLocalFiles } from '../openFiles'
import type { Skin } from './Skin'
import type { Player } from '../player/Player'

/** Spectrum resolution (same as the web version) */
const BAR_COUNT = 48
/** Irregular drip curtain positions along the blood line, % of the seek width */
const DRIP_X = [4, 8, 12, 17, 21, 25, 29, 34, 39, 43, 48, 52, 57, 62, 67, 72, 77, 82, 87, 91, 96]

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
  private activeIndex = -1
  /** Quantized eye glow, so the DOM only updates when the level moves */
  private eyeLevel = -1

  private durations = new Map<string, number>()
  private probed = new Set<string>()

  mount(player: Player): void {
    this.player = player
    this.mini = false
    const app = document.getElementById('app')!
    document.documentElement.dataset.skin = this.id

    this.container = document.createElement('div')
    this.container.className = 'skin dracula-skin'
    this.container.style.setProperty('--dr-frame-url', `url("${draculaFrameUrl}")`)
    this.container.style.setProperty('--dr-bat-url', `url("${draculaBatUrl}")`)
    this.container.style.setProperty('--dr-tools-url', `url("${draculaToolsUrl}")`)
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
    if (player) player.onTrackChange = null
    this.container?.remove()
    this.container = null
    this.els = null
    this.player = null
  }

  onPlaylistUpdate(): void {
    this.buildPlaylist()
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

          <!-- Blood line = seek, bracketed by the painted speakers -->
          <div class="dr-seek-region" role="group" aria-label="Seek">
            <div class="dr-seek-top">
              <button class="dr-vol dr-vol-down" aria-label="Volume down" title="Volume down"></button>
              <div class="dr-blood" aria-hidden="true"></div>
              <input class="dr-seek" type="range" min="0" max="1000" value="0"
                     aria-label="Seek through track" step="1" />
              <button class="dr-vol dr-vol-up" aria-label="Volume up" title="Volume up"></button>
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
              <button class="dr-tool dr-tool-close" aria-label="Close player" title="Close player"></button>
              <button class="dr-tool dr-tool-minimize" aria-label="Minimize" title="Minimize"></button>
              <button class="dr-tool dr-tool-folder" aria-label="Add audio files" title="Add audio files"></button>
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

    this.buildDrips()

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
      els.elapsed.textContent = fmt(cur)
      els.remaining.textContent = `-${fmt(Math.max(0, dur - cur))}`
    })
    els.seek.addEventListener('change', () => {
      p.seek(Number(els.seek.value) / 1000)
      this.seeking = false
    })

    // Volume → the painted speakers at the ends of the blood line
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

    // Tool row: close, minimize, add files, mini bat. No skin button — the
    // web build's is a "coming soon" stub and this build has no switcher.
    c.querySelector('.dr-tool-close')!.addEventListener('click', () => window.skinwalker?.close?.())
    c.querySelector('.dr-tool-minimize')!.addEventListener('click', () => window.skinwalker?.minimize?.())
    c.querySelector('.dr-tool-folder')!.addEventListener('click', () => void openLocalFiles(p))
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
    void applySkinShape(draculaBatUrl)
  }

  private exitMini(): void {
    if (!this.container || !this.mini) return
    this.mini = false
    this.container.classList.remove('mini-mode')
    window.skinwalker?.setWindowSize?.(STAGE_SIZE)
    void applySkinShape(draculaFrameUrl)
  }

  // ── Playlist ─────────────────────────────────────────────────────────────────

  private buildDrips(): void {
    const host = this.container?.querySelector('.dr-blood')
    if (!host) return
    host.replaceChildren()
    DRIP_X.forEach((x, i) => {
      const drip = document.createElement('span')
      drip.className = 'dr-drip'
      drip.style.setProperty('--x', `${x}%`)
      drip.style.setProperty('--w', `${0.16 + (i % 3) * 0.08}cqw`)
      drip.style.setProperty('--h', `${0.55 + ((i * 7) % 10) * 0.13}cqw`)
      drip.style.setProperty('--speed', `${1.7 + (i % 6) * 0.41}s`)
      drip.style.setProperty('--delay', `${-(i * 0.31)}s`)
      drip.style.fontSize = `${0.12 + (i % 3) * 0.04}cqw`
      host.appendChild(drip)
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

  /** Mirrored spectrum, as drawn by the web version: each measured height is
   *  drawn equally above and below the centre line. */
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

    const delta = this.lastFrame ? Math.min(2.5, (now - this.lastFrame) / 16.67) : 1
    this.lastFrame = now

    const mid = h / 2
    const pitch = w / BAR_COUNT
    const barW = pitch * 0.55

    // Faint gold centre line under the bars
    ctx.save()
    ctx.globalAlpha = 0.33
    ctx.strokeStyle = '#bd8852'
    ctx.lineWidth = Math.max(1, dpr * 0.7)
    ctx.beginPath()
    ctx.moveTo(w * 0.02, mid)
    ctx.lineTo(w * 0.98, mid)
    ctx.stroke()
    ctx.restore()

    for (let i = 0; i < BAR_COUNT; i++) {
      const x = (i + 0.5) * pitch
      const frac = i / (BAR_COUNT - 1)
      const edge = Math.abs((i - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2))

      // Idle bars keep breathing while paused
      let target = 0.025 + 0.018 * (0.5 + 0.5 * Math.sin(now * 0.0008 + i * 0.31))
      if (playing) {
        const bin = Math.min(
          this.freqData.length - 1,
          Math.max(1, Math.floor(Math.pow(frac, 2.2) * (this.freqData.length - 2) + 1)),
        )
        target += Math.pow(this.freqData[bin] / 255, 1.5) * 0.8
      }
      target *= 0.87 + 0.13 * (1 - edge)

      const response = target > this.levels[i] ? 0.12 : 0.045
      this.levels[i] += (target - this.levels[i]) * (1 - Math.pow(1 - response, delta))

      const half = Math.max(h * 0.015, this.levels[i] * h * 0.48)
      const top = mid - half
      const bottom = mid + half
      const warm = i < BAR_COUNT * 0.5

      const grad = ctx.createLinearGradient(0, top, 0, bottom)
      grad.addColorStop(0, warm ? 'rgba(251, 86, 75, 0.96)' : 'rgba(183, 95, 243, 0.96)')
      grad.addColorStop(0.5, warm ? 'rgba(135, 16, 31, 0.44)' : 'rgba(76, 20, 122, 0.44)')
      grad.addColorStop(1, warm ? 'rgba(251, 86, 75, 0.96)' : 'rgba(183, 95, 243, 0.96)')

      ctx.save()
      ctx.fillStyle = grad
      ctx.shadowColor = warm ? 'rgba(243, 40, 53, 0.65)' : 'rgba(149, 52, 242, 0.65)'
      ctx.shadowBlur = 7 * dpr
      ctx.fillRect(x - barW / 2, top, barW, half * 2)

      // Gold caps top and bottom
      ctx.shadowBlur = 4 * dpr
      ctx.shadowColor = '#e9b760'
      ctx.fillStyle = 'rgba(244, 202, 126, 0.9)'
      const cap = Math.max(1, dpr * 1.2)
      ctx.fillRect(x - barW / 2, top, barW, cap)
      ctx.fillRect(x - barW / 2, bottom - cap, barW, cap)
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

    const glow = playing ? Math.min(0.95, 0.18 + energy * 5) : 0.12
    const quantized = Math.round(glow * 20) / 20
    if (quantized === this.eyeLevel) return
    this.eyeLevel = quantized
    els.eyeLeft.style.opacity = String(quantized)
    els.eyeRight.style.opacity = String(quantized)
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

    const elapsedText = fmt(cur)
    if (els.elapsed.textContent !== elapsedText) els.elapsed.textContent = elapsedText
    const remainingText = `-${fmt(Math.max(0, dur - cur))}`
    if (els.remaining.textContent !== remainingText) els.remaining.textContent = remainingText
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
