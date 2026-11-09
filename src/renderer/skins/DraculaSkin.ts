/**
 * DraculaSkin — design flagship skin.
 *
 * Anatomy → controls mapping:
 *   Eyes (red glow pulse) ──── play/pause toggle
 *   Cape spread / wingspan ──── live visualizer bars (AnalyserNode)
 *   Fangs (left/right) ──────── prev / next track
 *   Blood drip on collar ────── seek bar (drip position = playback position)
 *   Medallion on chest ──────── volume control (rotates with value)
 *
 * All controls are wired to the player. Inline SVG art (hairline, eyes,
 * cape wings, fangs, medallion) is layered onto the same class hooks the
 * wiring and CSS already use — the SVG is the anatomy, not a picture of it.
 *
 * Image frame + separated mechanism (2026-11-09, Lan's direction): the
 * approved Dracula artwork itself is the frame — a text-free plate
 * (assets/dracula-frame.webp) clipped to the character outline — and each
 * element in the picture is a live control overlaid on its anatomy:
 * eyes = play/pause hotspot (+ glow while playing), blood line = seek,
 * medallion = volume (drag / wheel / arrows, orbit dot shows the value),
 * cape interior = live visualizer, fangs = prev/next hotspots, and the
 * real title + playlist are rendered over the art.
 */
import draculaFrameUrl from '../assets/dracula-frame.webp'
import eyeLeftUrl from '../assets/dracula-eye-left.png'
import eyeRightUrl from '../assets/dracula-eye-right.png'
import medallionUrl from '../assets/dracula-medallion.png'
import fangLeftUrl from '../assets/dracula-fang-left.png'
import fangRightUrl from '../assets/dracula-fang-right.png'
import type { Skin } from './Skin'
import type { Player } from '../player/Player'

export class DraculaSkin implements Skin {
  readonly id = 'dracula'
  readonly label = 'Dracula'

  private container: HTMLElement | null = null
  private rafId = 0
  private freqData: Uint8Array<ArrayBuffer> | null = null
  private player: Player | null = null

  mount(player: Player): void {
    this.player = player
    const app = document.getElementById('app')!
    document.documentElement.dataset.skin = this.id

    this.container = document.createElement('div')
    this.container.style.setProperty('--dr-frame-url', `url("${draculaFrameUrl}")`)
    this.container.className = 'skin dracula-skin'
    this.container.innerHTML = this.template()
    app.innerHTML = ''
    app.appendChild(this.container)

    this.freqData = new Uint8Array(player.audio.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>
    this.bindEvents()
    this.loop()
  }

  unmount(): void {
    cancelAnimationFrame(this.rafId)
    this.container?.remove()
    this.container = null
    this.player = null
  }

  onPlaylistUpdate(): void {
    this.buildPlaylist()
  }

  // ── DOM ──────────────────────────────────────────────────────────────────────

  private template(): string {
    return /* html */ `
      <div class="dr-body" aria-label="Dracula media player">

        <!-- Track info (rendered over the chest) -->
        <div class="dr-track-info">
          <span class="dr-title">—</span>
          <span class="dr-artist">—</span>
        </div>

        <!-- Eyes = play/pause (hotspot over the painted eyes + playing glow) -->
        <button class="dr-eyes" aria-label="Play / Pause" title="Play / Pause"></button>
        <div class="dr-eye-glow" aria-hidden="true"></div>

        <!-- Cape interior = live visualizer -->
        <div class="dr-cape" aria-hidden="true">
          <canvas class="dr-viz" width="330" height="220"></canvas>
        </div>

        <!-- Blood line = seek bar -->
        <div class="dr-seek-region" role="group" aria-label="Seek">
          <input class="dr-seek" type="range" min="0" max="1000" value="0"
                 aria-label="Seek" step="1" />
          <span class="dr-time">0:00 / 0:00</span>
        </div>

        <!-- Medallion = volume (drag horizontally, wheel, or arrow keys) -->
        <div class="dr-medallion" role="slider" tabindex="0"
             aria-label="Volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="80"
             title="Volume — drag, scroll, or arrow keys"></div>

        <!-- Fangs = prev / next (hotspots over the painted fangs) -->
        <div class="dr-controls">
          <button class="dr-prev" aria-label="Previous track"></button>
          <button class="dr-next" aria-label="Next track"></button>
        </div>

        <!-- Playlist (rendered over the lower cape) -->
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

    // Eyes → play/pause
    c.querySelector('.dr-eyes')!.addEventListener('click', () => {
      p.togglePlayPause()
      this.updatePlayState()
    })

    // Seek (blood drip)
    const seekEl = c.querySelector<HTMLInputElement>('.dr-seek')!
    seekEl.addEventListener('input', () => {
      p.seek(Number(seekEl.value) / 1000)
    })

    // Volume (medallion): drag horizontally, wheel, or arrow keys
    const medallion = c.querySelector<HTMLElement>('.dr-medallion')!
    const applyVolume = (v: number): void => {
      const clamped = Math.min(1, Math.max(0, v))
      p.setVolume(clamped)
      this.rotateMedallion(clamped * 100)
      medallion.setAttribute('aria-valuenow', String(Math.round(clamped * 100)))
    }
    let dragX: number | null = null
    let dragVol = 0
    medallion.addEventListener('pointerdown', (e) => {
      dragX = e.clientX
      dragVol = p.currentVolume
      medallion.setPointerCapture(e.pointerId)
    })
    medallion.addEventListener('pointermove', (e) => {
      if (dragX === null) return
      applyVolume(dragVol + (e.clientX - dragX) / 140)
    })
    medallion.addEventListener('pointerup', () => { dragX = null })
    medallion.addEventListener('pointercancel', () => { dragX = null })
    medallion.addEventListener('wheel', (e) => {
      e.preventDefault()
      applyVolume(p.currentVolume + (e.deltaY < 0 ? 0.05 : -0.05))
    }, { passive: false })
    medallion.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') applyVolume(p.currentVolume + 0.05)
      if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') applyVolume(p.currentVolume - 0.05)
    })
    // Init from the player's current volume so a skin swap keeps it
    applyVolume(p.currentVolume)

    // Fangs → prev / next
    c.querySelector('.dr-prev')!.addEventListener('click', () => p.prev())
    c.querySelector('.dr-next')!.addEventListener('click', () => p.next())

    // Track change
    p.onTrackChange = (track, idx) => {
      const titleEl = c.querySelector<HTMLElement>('.dr-title')
      const artistEl = c.querySelector<HTMLElement>('.dr-artist')
      if (titleEl) titleEl.textContent = track.title
      if (artistEl) artistEl.textContent = track.artist
      this.highlightPlaylistItem(idx)
    }

    this.buildPlaylist()
  }

  private buildPlaylist(): void {
    const p = this.player!
    const ol = this.container!.querySelector<HTMLOListElement>('.dr-playlist')!
    ol.innerHTML = ''
    p.playlist.forEach((track, i) => {
      const li = document.createElement('li')
      li.dataset.index = String(i)
      li.textContent = track.title
      li.setAttribute('role', 'button')
      li.setAttribute('tabindex', '0')
      li.setAttribute('aria-label', `Play ${track.title}`)
      li.addEventListener('click', () => void p.playIndex(i))
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') void p.playIndex(i)
      })
      ol.appendChild(li)
    })
  }

  private highlightPlaylistItem(idx: number): void {
    const ol = this.container?.querySelector('.dr-playlist')
    if (!ol) return
    ol.querySelectorAll('li').forEach((li, i) => {
      li.classList.toggle('active', i === idx)
      li.setAttribute('aria-current', i === idx ? 'true' : 'false')
    })
  }

  private updatePlayState(): void {
    const eyes = this.container?.querySelector('.dr-eyes')
    if (!eyes) return
    eyes.classList.toggle('playing', this.player?.audio.isPlaying ?? false)
  }

  private rotateMedallion(vol: number): void {
    const m = this.container?.querySelector<HTMLElement>('.dr-layer-medallion')
    if (!m) return
    m.style.transform = `rotate(${vol * 2.7}deg)`
  }

  // ── RAF loop ──────────────────────────────────────────────────────────────────

  private loop(): void {
    this.rafId = requestAnimationFrame(() => this.loop())
    this.drawVisualizer()
    this.updateSeek()
    this.updatePlayState()
  }

  private drawVisualizer(): void {
    if (!this.freqData || !this.player) return
    const canvas = this.container?.querySelector<HTMLCanvasElement>('.dr-viz')
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    this.player.audio.getFrequencyData(this.freqData)

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const barW = canvas.width / this.freqData.length
    for (let i = 0; i < this.freqData.length; i++) {
      const h = (this.freqData[i] / 255) * canvas.height
      // Deep crimson → purple sweep across the cape
      ctx.fillStyle = `hsl(${320 - i * 1.2}, 80%, ${30 + h / 5}%)`
      ctx.fillRect(i * barW, canvas.height - h, barW - 1, h)
    }
  }

  private updateSeek(): void {
    if (!this.player || !this.container) return
    const seek  = this.container.querySelector<HTMLInputElement>('.dr-seek')
    const timeEl = this.container.querySelector<HTMLElement>('.dr-time')
    const dur = this.player.audio.duration
    const cur = this.player.audio.currentTime
    if (seek && dur > 0) seek.value = String(Math.round((cur / dur) * 1000))
    if (timeEl) timeEl.textContent = `${fmt(cur)} / ${fmt(dur)}`
  }
}

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
