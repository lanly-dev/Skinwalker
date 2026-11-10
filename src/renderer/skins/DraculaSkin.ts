/**
 * DraculaSkin — design flagship skin.
 *
 * The approved artwork is the frame: a transparent plate
 * (assets/dracula-frame.webp) fills the frameless window, and every painted
 * element is a live control or readout:
 *
 *   Eyes ───────────── play/pause hotspot; the sockets bloom with the real
 *                     RMS energy of the track and dim when it stops
 *   Blood line ─────── seek (red fill to position, animated drip curtain,
 *                     elapsed / remaining readout)
 *   Medallion ──────── volume (drag / wheel / arrow keys; a gold orbit dot
 *                     and the medallion layer turn with the value)
 *   Cape interior ──── live spectrum (48 bars, crimson → violet, gold caps)
 *   Fangs ──────────── prev / next hotspots
 *   Chest panel ────── real title + artist
 *   Lower cape ─────── playlist with track numbers and durations
 *
 * The mechanics follow the web version of the player: energy-driven eye glow,
 * an irregular curtain of blood drips, attack/release-smoothed spectrum bars
 * with a gold cap on each, and "01. title • mm:ss" playlist rows.
 */
import draculaFrameUrl from '../assets/dracula-frame.webp'
import eyeLeftUrl from '../assets/dracula-eye-left.png'
import eyeRightUrl from '../assets/dracula-eye-right.png'
import medallionUrl from '../assets/dracula-medallion.png'
import fangLeftUrl from '../assets/dracula-fang-left.png'
import fangRightUrl from '../assets/dracula-fang-right.png'
import type { Skin } from './Skin'
import type { Player } from '../player/Player'

/** Spectrum resolution (same as the web version) */
const BAR_COUNT = 48
/** Irregular drip curtain positions along the blood line, % of the seek width */
const DRIP_X = [4, 8, 12, 17, 21, 25, 30, 34, 39, 44, 49, 54, 59, 64, 69, 74, 79, 84, 89, 94]

interface DraculaEls {
  title: HTMLElement
  artist: HTMLElement
  eyes: HTMLButtonElement
  eyeL: HTMLImageElement
  eyeR: HTMLImageElement
  canvas: HTMLCanvasElement
  seek: HTMLInputElement
  elapsed: HTMLElement
  remaining: HTMLElement
  medallion: HTMLElement
  orbit: SVGElement
  medallionLayer: HTMLImageElement
  playlist: HTMLOListElement
}

export class DraculaSkin implements Skin {
  readonly id = 'dracula'
  readonly label = 'Dracula'

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
  /** Quantized eye level, so the full-canvas layer filters only repaint on change */
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

        <!-- Track info over the chest -->
        <div class="dr-track-info">
          <span class="dr-title">—</span>
          <span class="dr-artist">—</span>
        </div>

        <!-- Eyes = play/pause hotspot (the layers bloom with the audio) -->
        <button class="dr-eyes" aria-label="Play" aria-pressed="false" title="Play / Pause"></button>

        <!-- Cape interior = live spectrum -->
        <div class="dr-cape" aria-hidden="true">
          <canvas class="dr-viz"></canvas>
        </div>

        <!-- Blood line = seek: fill, drip curtain, elapsed / remaining -->
        <div class="dr-seek-region" role="group" aria-label="Seek">
          <div class="dr-seek-top">
            <div class="dr-blood" aria-hidden="true"></div>
            <input class="dr-seek" type="range" min="0" max="1000" value="0"
                   aria-label="Seek through track" step="1" />
          </div>
          <div class="dr-times">
            <span class="dr-elapsed">00:00</span>
            <span class="dr-remaining">-00:00</span>
          </div>
        </div>

        <!-- Medallion = volume (drag, wheel, or arrow keys) -->
        <div class="dr-medallion" role="slider" tabindex="0"
             aria-label="Volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="80"
             title="Volume — drag, scroll, or arrow keys">
          <svg class="dr-medallion-orbit" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="7" r="6"></circle>
          </svg>
        </div>

        <!-- Fangs = prev / next hotspots -->
        <div class="dr-controls">
          <button class="dr-prev" aria-label="Previous track" title="Previous track"></button>
          <button class="dr-next" aria-label="Next track" title="Next track"></button>
        </div>

        <!-- Playlist over the lower cape -->
        <ol class="dr-playlist" aria-label="Playlist"></ol>

        <!-- Separated element layers (extracted from the plate art) -->
        <img class="dr-layer dr-layer-eye-l" src="${eyeLeftUrl}" alt="" aria-hidden="true" draggable="false">
        <img class="dr-layer dr-layer-eye-r" src="${eyeRightUrl}" alt="" aria-hidden="true" draggable="false">
        <img class="dr-layer dr-layer-medallion" src="${medallionUrl}" alt="" aria-hidden="true" draggable="false">
        <img class="dr-layer dr-layer-fang-l" src="${fangLeftUrl}" alt="" aria-hidden="true" draggable="false">
        <img class="dr-layer dr-layer-fang-r" src="${fangRightUrl}" alt="" aria-hidden="true" draggable="false">

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
      eyes: c.querySelector('.dr-eyes')!,
      eyeL: c.querySelector('.dr-layer-eye-l')!,
      eyeR: c.querySelector('.dr-layer-eye-r')!,
      canvas: c.querySelector('.dr-viz')!,
      seek: c.querySelector('.dr-seek')!,
      elapsed: c.querySelector('.dr-elapsed')!,
      remaining: c.querySelector('.dr-remaining')!,
      medallion: c.querySelector('.dr-medallion')!,
      orbit: c.querySelector('.dr-medallion-orbit')!,
      medallionLayer: c.querySelector('.dr-layer-medallion')!,
      playlist: c.querySelector('.dr-playlist')!,
    }
    this.els = els

    this.buildDrips()

    // Eyes → play/pause
    els.eyes.addEventListener('click', () => {
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

    // Medallion → volume: drag horizontally, wheel, or arrow keys
    const applyVolume = (v: number): void => {
      const vol = Math.min(1, Math.max(0, v))
      p.setVolume(vol)
      els.orbit.style.transform = `rotate(${vol * 360 - 90}deg)`
      els.medallionLayer.style.transform = `rotate(${vol * 1.2}deg)`
      els.medallion.setAttribute('aria-valuenow', String(Math.round(vol * 100)))
      els.medallion.setAttribute('aria-valuetext', `${Math.round(vol * 100)}%`)
    }
    let dragX: number | null = null
    let dragVol = 0
    els.medallion.addEventListener('pointerdown', (e) => {
      dragX = e.clientX
      dragVol = p.currentVolume
      els.medallion.setPointerCapture(e.pointerId)
    })
    els.medallion.addEventListener('pointermove', (e) => {
      if (dragX === null) return
      applyVolume(dragVol + (e.clientX - dragX) / 140)
    })
    els.medallion.addEventListener('pointerup', () => { dragX = null })
    els.medallion.addEventListener('pointercancel', () => { dragX = null })
    els.medallion.addEventListener('wheel', (e) => {
      e.preventDefault()
      applyVolume(p.currentVolume + (e.deltaY < 0 ? 0.05 : -0.05))
    }, { passive: false })
    els.medallion.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        e.preventDefault()
        applyVolume(p.currentVolume + 0.05)
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        e.preventDefault()
        applyVolume(p.currentVolume - 0.05)
      }
    })
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
      drip.style.setProperty('--w', `${1.8 + (i % 3) * 0.9}px`)
      drip.style.setProperty('--h', `${7 + ((i * 7) % 10) * 1.1}px`)
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
    const eyes = this.els?.eyes
    if (!eyes) return
    if (eyes.classList.contains('playing') === playing) return
    eyes.classList.toggle('playing', playing)
    eyes.setAttribute('aria-pressed', String(playing))
    eyes.setAttribute('aria-label', playing ? 'Pause' : 'Play')
  }

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

    const pitch = w / BAR_COUNT
    const barW = pitch * 0.55
    const base = h - dpr

    for (let i = 0; i < BAR_COUNT; i++) {
      const x = (i + 0.5) * pitch
      const frac = i / (BAR_COUNT - 1)

      // Idle bars keep breathing while paused, like the web version
      let target = 0.015 + 0.008 * (0.5 + 0.5 * Math.sin(now * 0.0008 + i * 0.31))
      if (playing) {
        // Log-ish bin mapping: the lows get the width, the highs get the tail
        const bin = Math.min(
          this.freqData.length - 1,
          Math.max(1, Math.floor(Math.pow(frac, 2.2) * (this.freqData.length - 2) + 1)),
        )
        target += Math.pow(this.freqData[bin] / 255, 1.5) * 0.62
      }

      // Asymmetric smoothing: jump up fast, settle down slow
      const response = target > this.levels[i] ? 0.16 : 0.06
      this.levels[i] += (target - this.levels[i]) * (1 - Math.pow(1 - response, delta))

      const barH = Math.max(2 * dpr, this.levels[i] * h)
      const top = base - barH
      const warm = frac < 0.5

      const grad = ctx.createLinearGradient(0, top, 0, base)
      grad.addColorStop(0, warm ? 'rgba(251, 86, 75, 0.95)' : 'rgba(183, 95, 243, 0.95)')
      grad.addColorStop(0.45, warm ? 'rgba(150, 16, 32, 0.5)' : 'rgba(76, 20, 122, 0.5)')
      grad.addColorStop(1, warm ? 'rgba(96, 8, 18, 0.16)' : 'rgba(44, 10, 72, 0.16)')

      ctx.save()
      ctx.fillStyle = grad
      ctx.shadowColor = warm ? 'rgba(243, 40, 53, 0.55)' : 'rgba(149, 52, 242, 0.55)'
      ctx.shadowBlur = 6 * dpr
      ctx.fillRect(x - barW / 2, top, barW, barH)

      // Gold cap on every bar
      ctx.shadowBlur = 3 * dpr
      ctx.shadowColor = '#e9b760'
      ctx.fillStyle = 'rgba(244, 202, 126, 0.9)'
      ctx.fillRect(x - barW / 2, top, barW, Math.max(1, dpr * 1.2))
      ctx.restore()
    }
  }

  /** Eyes are a readout: socket bloom follows the real signal energy */
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

    const level = playing ? Math.min(0.95, 0.3 + energy * 5.5) : 0.12
    const quantized = Math.round(level * 12)
    if (quantized === this.eyeLevel) return
    this.eyeLevel = quantized

    const filter = playing
      ? `brightness(${(1.1 + energy * 1.6).toFixed(2)}) saturate(1.15) ` +
        `drop-shadow(0 0 ${Math.min(18, 2 + energy * 45).toFixed(0)}px rgba(255,50,30,0.8))`
      : 'brightness(0.55) saturate(0.7)'
    els.eyeL.style.filter = filter
    els.eyeR.style.filter = filter
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
