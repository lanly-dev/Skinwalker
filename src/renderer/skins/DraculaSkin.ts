/**
 * DraculaSkin — design flagship skin.
 *
 * The plate is the artwork from the web version of the player: a transparent
 * character silhouette (assets/dracula-frame.webp) whose painted anatomy is
 * the interface. Live controls sit on the painted elements, and the baked
 * placeholder panels (title, blood line, playlist) are covered by the live
 * panels exactly as the web build does it.
 *
 * Anatomy → control / readout:
 *   Eyes ───────────── readout: the sockets bloom with the track's RMS energy
 *   Medallion ──────── play / pause (burns while playing) — the web version's #play
 *   Chest panel ────── live title + artist
 *   Blood line ─────── seek: live fill, drip curtain, elapsed / remaining
 *   Speakers ───────── volume down / up at the ends of the blood line
 *   Cape interior ──── mirrored spectrum, crimson → violet with gold caps
 *   Lower fangs ────── prev / next hotspots
 *   Lower cape ─────── playlist (numbered rows with durations)
 *
 * Geometry is taken from the web build's CSS, as percentages of the 2:3 stage,
 * so the live elements land on the painted ones.
 */
import draculaFrameUrl from '../assets/dracula-frame.webp'
import type { Skin } from './Skin'
import type { Player } from '../player/Player'

/** Spectrum resolution (same as the web version) */
const BAR_COUNT = 48
/** Irregular drip curtain positions along the blood line, % of the seek width */
const DRIP_X = [4, 8, 12, 17, 21, 25, 30, 34, 39, 44, 49, 54, 59, 64, 69, 74, 79, 84, 89, 94]

const SPEAKER_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M4 9h4l5-4v14l-5-4H4z"/>' +
  '<path d="M16.5 8.2a5.2 5.2 0 0 1 0 7.6" fill="none" stroke="currentColor" ' +
  'stroke-width="2.2" stroke-linecap="round"/>' +
  '</svg>'

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
  volDown: HTMLButtonElement
  volUp: HTMLButtonElement
  playlist: HTMLOListElement
}

export class DraculaSkin implements Skin {
  readonly id = 'dracula'
  readonly label = 'Dracula'
  readonly shapeImage = draculaFrameUrl

  private container: HTMLElement | null = null
  private player: Player | null = null
  private els: DraculaEls | null = null
  private rafId = 0

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
    const app = document.getElementById('app')!
    document.documentElement.dataset.skin = this.id

    this.container = document.createElement('div')
    this.container.className = 'skin dracula-skin'
    this.container.style.setProperty('--dr-frame-url', `url("${draculaFrameUrl}")`)
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
      <div class="dr-body" aria-label="Dracula media player">

        <!-- Aura layers: soft halo + fine contour behind the plate. They soak
             up the cut edge's JPEG grit so it reads as outline, not rough cut. -->
        <span class="dr-aura" aria-hidden="true"></span>
        <span class="dr-rim" aria-hidden="true"></span>
        <span class="dr-plate" aria-hidden="true"></span>

        <!-- Chest panel = live title + artist (covers the baked placeholder) -->
        <div class="dr-track-info">
          <span class="dr-title">—</span>
          <span class="dr-artist">—</span>
        </div>

        <!-- Eyes are a readout: these glows ride the painted sockets -->
        <span class="dr-eye dr-eye-left" aria-hidden="true"></span>
        <span class="dr-eye dr-eye-right" aria-hidden="true"></span>

        <!-- Cape interior = mirrored spectrum -->
        <div class="dr-cape" aria-hidden="true">
          <canvas class="dr-viz"></canvas>
        </div>

        <!-- Blood line = seek, bracketed by the volume speakers -->
        <div class="dr-seek-region" role="group" aria-label="Seek">
          <div class="dr-seek-top">
            <button class="dr-vol dr-vol-down" aria-label="Volume down" title="Volume down">${SPEAKER_SVG}</button>
            <div class="dr-blood" aria-hidden="true"></div>
            <input class="dr-seek" type="range" min="0" max="1000" value="0"
                   aria-label="Seek through track" step="1" />
            <button class="dr-vol dr-vol-up" aria-label="Volume up" title="Volume up">${SPEAKER_SVG}</button>
          </div>
          <div class="dr-times">
            <span class="dr-elapsed">00:00</span>
            <span class="dr-remaining">-00:00</span>
          </div>
        </div>

        <!-- Medallion at the throat = play / pause -->
        <button class="dr-medallion" aria-label="Play" aria-pressed="false" title="Play / Pause"></button>

        <!-- Lower fangs = prev / next hotspots -->
        <div class="dr-controls">
          <button class="dr-prev" aria-label="Previous track" title="Previous track"></button>
          <button class="dr-next" aria-label="Next track" title="Next track"></button>
        </div>

        <!-- Lower cape = playlist -->
        <ol class="dr-playlist" aria-label="Playlist"></ol>

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
      volDown: c.querySelector('.dr-vol-down')!,
      volUp: c.querySelector('.dr-vol-up')!,
      playlist: c.querySelector('.dr-playlist')!,
    }
    this.els = els

    this.buildDrips()

    // Medallion → play/pause
    els.medallion.addEventListener('click', () => {
      p.togglePlayPause()
      this.updatePlayState()
    })

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

    // Volume → the speaker icons bracketing the blood line
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

    // Fangs → prev / next
    c.querySelector('.dr-prev')!.addEventListener('click', () => p.prev())
    c.querySelector('.dr-next')!.addEventListener('click', () => p.next())

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

  private buildDrips(): void {
    const host = this.container?.querySelector('.dr-blood')
    if (!host) return
    host.replaceChildren()
    DRIP_X.forEach((x, i) => {
      const drip = document.createElement('span')
      drip.className = 'dr-drip'
      drip.style.setProperty('--x', `${x}%`)
      drip.style.setProperty('--w', `${1 + (i % 3) * 0.6}px`)
      drip.style.setProperty('--h', `${4 + ((i * 7) % 10) * 0.7}px`)
      drip.style.setProperty('--speed', `${1.7 + (i % 6) * 0.41}s`)
      drip.style.setProperty('--delay', `${-(i * 0.31)}s`)
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
    const medallion = this.els?.medallion
    if (!medallion) return
    if (medallion.classList.contains('playing') === playing) return
    medallion.classList.toggle('playing', playing)
    medallion.setAttribute('aria-pressed', String(playing))
    medallion.setAttribute('aria-label', playing ? 'Pause' : 'Play')
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
