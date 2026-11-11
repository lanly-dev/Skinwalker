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
 *   Jaw ─────────────────────── live visualizer: 20 mirrored bars
 *   Eye sockets ─────────────── readout: the sockets bloom with the same energy
 *   Bone board overhead ─────── playlist, scrolling inside the bone frame
 *   Blood line ──────────────── seek: live fill, elapsed / remaining
 *   Left bone column ────────── volume (vertical)
 *   Bone plaques ────────────── prev / next
 *   Title block ─────────────── live title + artist over the painted one
 *
 * The four painted icons on the right bone column are artwork from the web
 * build (three of them were dead "coming soon" stubs there), so they get no
 * hotspots here — a painted detail, not a control.
 */
import framePlate from '../assets/skeleton-frame.webp'
import type { Skin } from './Skin'
import type { Player } from '../player/Player'

/** Mirrored spectrum resolution — the web build draws 20 bars */
const BAR_COUNT = 20
/** Bar colours, cycling every seven bars as in the web build */
const BAR_COLORS = ['#2be5ff', '#8aff9a', '#bd79ff']
/** Playlist skull colours, cycling per row as in the web build */
const ROW_COLORS = ['#35dfff', '#94ea6b', '#bd80ff']

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
  playlist: HTMLOListElement
}

export class SkeletonSkin implements Skin {
  readonly id = 'skeleton'
  readonly label = 'Skeleton'
  readonly shapeImage = framePlate
  /** 3:2, like the web build's stage — the plate is 1536×1024 */
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
  }

  // ── DOM ──────────────────────────────────────────────────────────────────────

  private template(): string {
    return /* html */ `
      <div class="sk-body" role="img" aria-label="Skeleton media player" style="--eye: 0.16">

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

        <!-- Left bone column = volume -->
        <input class="sk-volume" type="range" min="0" max="100" step="1" value="80"
               orient="vertical" aria-label="Volume" title="Volume" />

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
      playlist: c.querySelector('.sk-list')!,
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
      els.seek.style.setProperty('--progress', `${Number(els.seek.value) / 10}%`)
      els.elapsed.textContent = fmt(cur)
      els.remaining.textContent = `-${fmt(Math.max(0, dur - cur))}`
    })
    els.seek.addEventListener('change', () => {
      p.seek(Number(els.seek.value) / 1000)
      this.seeking = false
    })

    // Volume: the left bone column
    const applyVolume = (value: number): void => {
      const vol = Math.min(1, Math.max(0, value))
      p.setVolume(vol)
      els.volume.value = String(Math.round(vol * 100))
      els.volume.title = `Volume — ${Math.round(vol * 100)}%`
      els.volume.setAttribute('aria-valuetext', `${Math.round(vol * 100)}%`)
    }
    els.volume.addEventListener('input', () => applyVolume(Number(els.volume.value) / 100))
    // Start from the player's volume so a mid-playback swap never resets it
    applyVolume(p.currentVolume)

    // Bone plaques → prev / next
    c.querySelector('.sk-prev')!.addEventListener('click', () => p.prev())
    c.querySelector('.sk-next')!.addEventListener('click', () => p.next())

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
  }

  /**
   * The web build's spectrum: twenty mirrored bars, each drawn equally above
   * and below the centre line, coloured in blocks of seven. The same energy
   * sum drives the eye bloom through --eye.
   */
  private drawVisualizer(now: number): void {
    const els = this.els
    const p = this.player
    if (!els || !p) return

    const ctx = els.canvas.getContext('2d')
    if (!ctx) return

    const playing = p.audio.isPlaying
    if (playing && this.freqData) p.audio.getFrequencyData(this.freqData)

    ctx.clearRect(0, 0, 320, 200)

    let energy = 0
    for (let i = 0; i < BAR_COUNT; i++) {
      let value: number
      if (playing && this.freqData) {
        const bin = Math.min(this.freqData.length - 1, 2 + i * 3)
        value = this.freqData[bin] / 255
      } else {
        // Idle bars keep breathing while paused
        value = 0.06 + 0.025 * Math.sin(now / 700 + i * 0.6)
      }
      this.smooth[i] += (value - this.smooth[i]) * 0.15
      energy += this.smooth[i]

      const height = 6 + this.smooth[i] * 77
      ctx.fillStyle = BAR_COLORS[Math.floor(i / 7) % BAR_COLORS.length]
      ctx.shadowColor = ctx.fillStyle
      ctx.shadowBlur = 9
      ctx.fillRect(5 + i * 15.5, 100 - height, 9, height * 2)
    }

    const eye = playing ? Math.min(1, 0.3 + (energy / BAR_COUNT) * 1.9) : 0.16
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
