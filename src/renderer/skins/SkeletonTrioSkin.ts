/**
 * SkeletonTrioSkin — skin #4, IMAGE-FRAME pass.
 *
 * Three skeletons shoulder-to-shoulder as ONE frame (transparent
 * plate, assets/skeleton-trio-frame.webp). The six glowing eye
 * sockets are a single separated layer (mint / cyan / violet) that
 * pulses while playing. The CENTER skeleton carries the working
 * anatomy; the raised outer hands are prev / next.
 *
 * Anatomy → controls mapping:
 *   All 3 skulls' eye sockets ─ play/pause toggle (one wide hotspot)
 *   Center jaw / teeth gap ──── live visualizer (AnalyserNode)
 *   Group ribcage line ──────── seek bar (transparent track)
 *   Center spine vertebrae ──── volume (VERTICAL drag; glow travels)
 *   Raised hands (top L/R) ──── prev / next track
 */
import type { Skin } from './Skin'
import type { Player } from '../player/Player'
import framePlate from '../assets/skeleton-trio-frame.webp'
import eyesLayer from '../assets/skeleton-trio-eyes.png'

export class SkeletonTrioSkin implements Skin {
  readonly id = 'skeleton-trio'
  readonly label = 'Skeleton Trio'

  private container: HTMLElement | null = null
  private rafId = 0
  private freqData: Uint8Array<ArrayBuffer> | null = null
  private player: Player | null = null

  mount(player: Player): void {
    this.player = player
    const app = document.getElementById('app')!
    document.documentElement.dataset.skin = this.id

    this.container = document.createElement('div')
    this.container.className = 'skin skeleton-trio-skin'
    this.container.style.setProperty('--tr-frame-url', `url(${framePlate})`)
    this.container.style.setProperty('--tr-eyes-url', `url(${eyesLayer})`)
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
      <div class="tr-body" role="img" aria-label="Skeleton trio media player">
        <img class="tr-layer tr-eyes-layer" alt="" draggable="false" />

        <!-- Eye sockets = play/pause -->
        <button class="tr-eyes" aria-label="Play / Pause" title="Play / Pause"></button>
        <div class="tr-eye-glow" aria-hidden="true"></div>

        <!-- Track info over the clavicles -->
        <div class="tr-track-info">
          <span class="tr-title">—</span>
          <span class="tr-artist">—</span>
        </div>

        <!-- Jaw gap = visualizer -->
        <div class="tr-viz-panel" aria-hidden="true">
          <canvas class="tr-viz" width="200" height="110"></canvas>
        </div>

        <!-- Raised hands = prev / next -->
        <button class="tr-prev" aria-label="Previous track" title="Previous track"></button>
        <button class="tr-next" aria-label="Next track" title="Next track"></button>

        <!-- Ribcage line = seek -->
        <div class="tr-seek-region" role="group" aria-label="Seek">
          <input class="tr-seek" type="range" min="0" max="1000" value="0"
                 aria-label="Seek" step="1" />
          <span class="tr-time">0:00 / 0:00</span>
        </div>

        <!-- Spine = volume (vertical) -->
        <div class="tr-spine-vol" role="slider" tabindex="0"
             aria-label="Volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="80"
             aria-orientation="vertical">
          <div class="tr-spine-fill" aria-hidden="true"></div>
          <div class="tr-spine-dot" aria-hidden="true"></div>
        </div>

        <!-- Playlist inside the center pelvis -->
        <ol class="tr-playlist" aria-label="Playlist"></ol>
      </div>
    `
  }

  // ── Events ───────────────────────────────────────────────────────────────────

  private bindEvents(): void {
    const c = this.container!
    const p = this.player!

    c.querySelector('.tr-eyes')!.addEventListener('click', () => {
      p.togglePlayPause()
      this.updatePlayState()
    })

    const seekEl = c.querySelector<HTMLInputElement>('.tr-seek')!
    seekEl.addEventListener('input', () => p.seek(Number(seekEl.value) / 1000))

    // Volume: the spine. Drag vertically — top is loud, bottom is quiet.
    const spineEl = c.querySelector<HTMLElement>('.tr-spine-vol')!
    const fillEl = c.querySelector<HTMLElement>('.tr-spine-fill')!
    const dotEl = c.querySelector<HTMLElement>('.tr-spine-dot')!
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

    c.querySelector('.tr-prev')!.addEventListener('click', () => p.prev())
    c.querySelector('.tr-next')!.addEventListener('click', () => p.next())

    p.onTrackChange = (track, idx) => {
      const titleEl = c.querySelector<HTMLElement>('.tr-title')
      const artistEl = c.querySelector<HTMLElement>('.tr-artist')
      if (titleEl) titleEl.textContent = track.title
      if (artistEl) artistEl.textContent = track.artist
      this.highlightPlaylistItem(idx)
    }

    this.buildPlaylist()
  }

  private buildPlaylist(): void {
    const p = this.player!
    const ol = this.container!.querySelector<HTMLOListElement>('.tr-playlist')!
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
    const ol = this.container?.querySelector('.tr-playlist')
    if (!ol) return
    ol.querySelectorAll('li').forEach((li, i) => {
      li.classList.toggle('active', i === idx)
      li.setAttribute('aria-current', i === idx ? 'true' : 'false')
    })
  }

  private updatePlayState(): void {
    const eyes = this.container?.querySelector('.tr-eyes')
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
    const canvas = this.container?.querySelector<HTMLCanvasElement>('.tr-viz')
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    this.player.audio.getFrequencyData(this.freqData)

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const bars = 14
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
    const seek = this.container.querySelector<HTMLInputElement>('.tr-seek')
    const timeEl = this.container.querySelector<HTMLElement>('.tr-time')
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
