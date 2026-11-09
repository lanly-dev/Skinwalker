/**
 * SkeletonSkin — skin #3, IMAGE-FRAME pass.
 *
 * The approved character artwork IS the frame: the transparent plate
 * (assets/skeleton-frame.webp) fills the frameless window — the gaps
 * between the bones are genuinely see-through — and the painted
 * elements are the controls. The glowing eye cores are separated
 * layers (color segmentation, full-canvas, pixel-exact stacking).
 *
 * Anatomy → controls mapping:
 *   Eye sockets (glow layers) ─ play/pause toggle (layers pulse while playing)
 *   Jaw / teeth gap ─────────── live visualizer (AnalyserNode)
 *   Ribcage line ────────────── seek bar (transparent track across the ribs)
 *   Spine vertebrae ─────────── volume (VERTICAL drag; vertebrae light up)
 *   Bony hands (L/R) ────────── prev / next track
 */
import type { Skin } from './Skin'
import type { Player } from '../player/Player'
import framePlate from '../assets/skeleton-frame.webp'
import eyeLeftLayer from '../assets/skeleton-eye-left.png'
import eyeRightLayer from '../assets/skeleton-eye-right.png'

export class SkeletonSkin implements Skin {
  readonly id = 'skeleton'
  readonly label = 'Skeleton'

  private container: HTMLElement | null = null
  private rafId = 0
  private freqData: Uint8Array<ArrayBuffer> | null = null
  private player: Player | null = null

  mount(player: Player): void {
    this.player = player
    const app = document.getElementById('app')!
    document.documentElement.dataset.skin = this.id

    this.container = document.createElement('div')
    this.container.className = 'skin skeleton-skin'
    this.container.style.setProperty('--sk-frame-url', `url(${framePlate})`)
    this.container.style.setProperty('--sk-eye-left-url', `url(${eyeLeftLayer})`)
    this.container.style.setProperty('--sk-eye-right-url', `url(${eyeRightLayer})`)
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
      <div class="sk-body" role="img" aria-label="Skeleton media player">
        <img class="sk-layer sk-eye-layer left" alt="" draggable="false" />
        <img class="sk-layer sk-eye-layer right" alt="" draggable="false" />

        <!-- Eye sockets = play/pause -->
        <button class="sk-eyes" aria-label="Play / Pause" title="Play / Pause"></button>
        <div class="sk-eye-glow" aria-hidden="true"></div>

        <!-- Track info over the clavicles -->
        <div class="sk-track-info">
          <span class="sk-title">—</span>
          <span class="sk-artist">—</span>
        </div>

        <!-- Jaw gap = visualizer -->
        <div class="sk-viz-panel" aria-hidden="true">
          <canvas class="sk-viz" width="216" height="84"></canvas>
        </div>

        <!-- Bony hands = prev / next -->
        <button class="sk-prev" aria-label="Previous track" title="Previous track"></button>
        <button class="sk-next" aria-label="Next track" title="Next track"></button>

        <!-- Ribcage line = seek -->
        <div class="sk-seek-region" role="group" aria-label="Seek">
          <input class="sk-seek" type="range" min="0" max="1000" value="0"
                 aria-label="Seek" step="1" />
          <span class="sk-time">0:00 / 0:00</span>
        </div>

        <!-- Spine = volume (vertical) -->
        <div class="sk-spine-vol" role="slider" tabindex="0"
             aria-label="Volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="80"
             aria-orientation="vertical">
          <div class="sk-spine-fill" aria-hidden="true"></div>
          <div class="sk-spine-dot" aria-hidden="true"></div>
        </div>

        <!-- Playlist inside the pelvis -->
        <ol class="sk-playlist" aria-label="Playlist"></ol>
      </div>
    `
  }

  // ── Events ───────────────────────────────────────────────────────────────────

  private bindEvents(): void {
    const c = this.container!
    const p = this.player!

    c.querySelector('.sk-eyes')!.addEventListener('click', () => {
      p.togglePlayPause()
      this.updatePlayState()
    })

    const seekEl = c.querySelector<HTMLInputElement>('.sk-seek')!
    seekEl.addEventListener('input', () => p.seek(Number(seekEl.value) / 1000))

    // Volume: the spine. Drag vertically — top is loud, bottom is quiet.
    const spineEl = c.querySelector<HTMLElement>('.sk-spine-vol')!
    const fillEl = c.querySelector<HTMLElement>('.sk-spine-fill')!
    const dotEl = c.querySelector<HTMLElement>('.sk-spine-dot')!
    let vol = p.currentVolume
    const applyVolume = (v: number): void => {
      vol = Math.min(1, Math.max(0, v))
      p.setVolume(vol)
      fillEl.style.height = `${vol * 100}%`
      dotEl.style.bottom = `calc(${vol * 100}% - 9px)`
      spineEl.setAttribute('aria-valuenow', String(Math.round(vol * 100)))
    }
    applyVolume(vol)

    let dragging = false
    const volFromEvent = (e: PointerEvent): number => {
      const r = spineEl.getBoundingClientRect()
      return 1 - (e.clientY - r.top) / r.height
    }
    spineEl.addEventListener('pointerdown', (e) => {
      dragging = true
      spineEl.setPointerCapture(e.pointerId)
      applyVolume(volFromEvent(e))
    })
    spineEl.addEventListener('pointermove', (e) => {
      if (dragging) applyVolume(volFromEvent(e))
    })
    spineEl.addEventListener('pointerup', () => { dragging = false })
    spineEl.addEventListener('wheel', (e) => {
      e.preventDefault()
      applyVolume(vol + (e.deltaY < 0 ? 0.05 : -0.05))
    }, { passive: false })
    spineEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { applyVolume(vol + 0.05); e.preventDefault() }
      if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { applyVolume(vol - 0.05); e.preventDefault() }
    })

    c.querySelector('.sk-prev')!.addEventListener('click', () => p.prev())
    c.querySelector('.sk-next')!.addEventListener('click', () => p.next())

    p.onTrackChange = (track, idx) => {
      const titleEl = c.querySelector<HTMLElement>('.sk-title')
      const artistEl = c.querySelector<HTMLElement>('.sk-artist')
      if (titleEl) titleEl.textContent = track.title
      if (artistEl) artistEl.textContent = track.artist
      this.highlightPlaylistItem(idx)
    }

    this.buildPlaylist()
  }

  private buildPlaylist(): void {
    const p = this.player!
    const ol = this.container!.querySelector<HTMLOListElement>('.sk-playlist')!
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
    const ol = this.container?.querySelector('.sk-playlist')
    if (!ol) return
    ol.querySelectorAll('li').forEach((li, i) => {
      li.classList.toggle('active', i === idx)
      li.setAttribute('aria-current', i === idx ? 'true' : 'false')
    })
  }

  private updatePlayState(): void {
    const eyes = this.container?.querySelector('.sk-eyes')
    if (!eyes) return
    eyes.classList.toggle('playing', this.player?.audio.isPlaying ?? false)
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
    const canvas = this.container?.querySelector<HTMLCanvasElement>('.sk-viz')
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    this.player.audio.getFrequencyData(this.freqData)

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const bars = 18
    const barW = canvas.width / bars
    for (let i = 0; i < bars; i++) {
      const v = this.freqData[Math.floor((i / bars) * this.freqData.length)] / 255
      const h = Math.max(3, v * canvas.height)
      ctx.fillStyle = `hsl(200, 70%, ${55 + v * 30}%)`
      ctx.fillRect(i * barW + 1, canvas.height - h, barW - 2, h)
    }
  }

  private updateSeek(): void {
    if (!this.player || !this.container) return
    const seek = this.container.querySelector<HTMLInputElement>('.sk-seek')
    const timeEl = this.container.querySelector<HTMLElement>('.sk-time')
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
