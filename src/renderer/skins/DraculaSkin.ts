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
 */
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

        <!-- Track info -->
        <div class="dr-track-info">
          <span class="dr-title">—</span>
          <span class="dr-artist">—</span>
        </div>

        <!-- Widow's-peak hairline (SVG brow over the eyes) -->
        <svg class="dr-hairline" viewBox="0 0 300 42" preserveAspectRatio="none" aria-hidden="true">
          <path d="M4 40 V16 Q74 2 124 12 Q142 16 150 27 Q158 16 176 12 Q226 2 296 16 V40 Q150 28 4 40 Z"/>
        </svg>

        <!-- Eyes = play/pause -->
        <button class="dr-eyes" aria-label="Play / Pause" title="Play / Pause">
          <span class="dr-eye left" aria-hidden="true">
            <svg viewBox="0 0 36 36">
              <path class="dr-sclera" d="M3 18 Q18 5 33 18 Q18 29 3 18 Z"/>
              <circle class="dr-iris" cx="18" cy="17" r="6.5"/>
              <circle class="dr-pupil" cx="18" cy="17" r="2.8"/>
            </svg>
          </span>
          <span class="dr-eye right" aria-hidden="true">
            <svg viewBox="0 0 36 36">
              <path class="dr-sclera" d="M3 18 Q18 5 33 18 Q18 29 3 18 Z"/>
              <circle class="dr-iris" cx="18" cy="17" r="6.5"/>
              <circle class="dr-pupil" cx="18" cy="17" r="2.8"/>
            </svg>
          </span>
        </button>

        <!-- Cape = visualizer -->
        <div class="dr-cape" aria-hidden="true">
          <canvas class="dr-viz" width="256" height="80"></canvas>
          <svg class="dr-cape-wings" viewBox="0 0 300 18" preserveAspectRatio="none">
            <path d="M0 0 H300 V3 Q263 17 226 6 Q188 17 150 6 Q112 17 74 6 Q37 17 0 3 Z"/>
          </svg>
        </div>

        <!-- Blood drip = seek bar -->
        <div class="dr-seek-region" role="group" aria-label="Seek">
          <input class="dr-seek" type="range" min="0" max="1000" value="0"
                 aria-label="Seek" step="1" />
          <span class="dr-time">0:00 / 0:00</span>
        </div>

        <!-- Medallion = volume -->
        <div class="dr-volume-region" role="group" aria-label="Volume">
          <span class="dr-medallion" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle class="dr-medallion-ring" cx="12" cy="12" r="10"/>
              <circle class="dr-medallion-gem" cx="12" cy="12" r="5.5"/>
              <path class="dr-medallion-spark" d="M12 8.5 L13.2 11 L15.8 12 L13.2 13 L12 15.5 L10.8 13 L8.2 12 L10.8 11 Z"/>
            </svg>
          </span>
          <input class="dr-volume" type="range" min="0" max="100" value="80"
                 aria-label="Volume" step="1" />
        </div>

        <!-- Fangs = prev / next -->
        <div class="dr-controls">
          <button class="dr-prev" aria-label="Previous track"><svg class="dr-fang" viewBox="0 0 16 18" aria-hidden="true"><path d="M2 0 H14 L9.5 16.5 Q8 18.4 6.5 16.5 Z"/></svg>◀</button>
          <button class="dr-next" aria-label="Next track">▶<svg class="dr-fang" viewBox="0 0 16 18" aria-hidden="true"><path d="M2 0 H14 L9.5 16.5 Q8 18.4 6.5 16.5 Z"/></svg></button>
        </div>

        <!-- Playlist -->
        <ol class="dr-playlist" aria-label="Playlist"></ol>

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

    // Volume (medallion)
    const volEl = c.querySelector<HTMLInputElement>('.dr-volume')!
    volEl.addEventListener('input', () => {
      p.setVolume(Number(volEl.value) / 100)
      this.rotateMedallion(Number(volEl.value))
    })
    // Init from the player's current volume so a skin swap keeps it
    volEl.value = String(Math.round(p.currentVolume * 100))
    p.setVolume(Number(volEl.value) / 100)
    this.rotateMedallion(Number(volEl.value))

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
    const m = this.container?.querySelector<HTMLElement>('.dr-medallion')
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
