/**
 * SkeletonSkin — skin #3.
 *
 * Anatomy → controls mapping:
 *   Skull jaw (gap) ────────── live visualizer bars (AnalyserNode)
 *   Eye sockets (glow) ─────── play/pause toggle
 *   Ribcage bars ───────────── seek bar (ribs fill left-to-right with progress)
 *   Spine vertebrae ────────── volume control
 *   Arm bones (left/right) ─── prev / next track
 *
 * Functional stub — all controls wired. Replace HTML with full SVG art later.
 */
import type { Skin } from './Skin'
import type { Player } from '../player/Player'

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
      <div class="sk-body" aria-label="Skeleton media player">

        <!-- Track info -->
        <div class="sk-track-info">
          <span class="sk-title">—</span>
          <span class="sk-artist">—</span>
        </div>

        <!-- Eye sockets = play/pause -->
        <button class="sk-eyes" aria-label="Play / Pause" title="Play / Pause">
          <span class="sk-eye left"  aria-hidden="true"></span>
          <span class="sk-eye right" aria-hidden="true"></span>
        </button>

        <!-- Skull jaw = visualizer -->
        <div class="sk-jaw" aria-hidden="true">
          <canvas class="sk-viz" width="256" height="64"></canvas>
        </div>

        <!-- Arm bones = prev / next -->
        <div class="sk-controls">
          <button class="sk-prev" aria-label="Previous track">🦴◀</button>
          <button class="sk-next" aria-label="Next track">▶🦴</button>
        </div>

        <!-- Ribcage = seek bar -->
        <div class="sk-seek-region" role="group" aria-label="Seek">
          <input class="sk-seek" type="range" min="0" max="1000" value="0"
                 aria-label="Seek" step="1" />
          <span class="sk-time">0:00 / 0:00</span>
        </div>

        <!-- Spine = volume -->
        <div class="sk-volume-region" role="group" aria-label="Volume">
          <span class="sk-spine" aria-hidden="true">◈</span>
          <input class="sk-volume" type="range" min="0" max="100" value="80"
                 aria-label="Volume" step="1" />
        </div>

        <!-- Playlist -->
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

    const volEl = c.querySelector<HTMLInputElement>('.sk-volume')!
    volEl.addEventListener('input', () => p.setVolume(Number(volEl.value) / 100))
    p.setVolume(Number(volEl.value) / 100)

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
    const barW = canvas.width / this.freqData.length
    for (let i = 0; i < this.freqData.length; i++) {
      const h = (this.freqData[i] / 255) * canvas.height
      // Bone white → pale blue-grey, like moonlit calcium
      ctx.fillStyle = `hsl(${200 + i * 0.3}, ${15 + h / 8}%, ${55 + h / 7}%)`
      ctx.fillRect(i * barW, canvas.height - h, barW - 1, h)
    }
  }

  private updateSeek(): void {
    if (!this.player || !this.container) return
    const seek   = this.container.querySelector<HTMLInputElement>('.sk-seek')
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
