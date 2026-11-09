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
 * Character-as-frame (2026-11-09): the player IS Dracula's silhouette —
 * head, ears, high collar and cape as one SVG shape behind the controls.
 * No rectangular window; the frameless transparent app window shows the
 * desktop everywhere outside the character.
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

        <!-- Character silhouette = the frame itself (head, ears, collar, cape) -->
        <svg class="dr-silhouette" viewBox="0 0 400 600" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="dr-cape-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#2b0e20"/>
              <stop offset=".45" stop-color="#180818"/>
              <stop offset="1" stop-color="#0a040c"/>
            </linearGradient>
            <radialGradient id="dr-face-grad" cx=".5" cy=".42" r=".65">
              <stop offset="0" stop-color="#3d1628"/>
              <stop offset="1" stop-color="#1c0a16"/>
            </radialGradient>
          </defs>
          <path class="dr-silhouette-fill" fill="url(#dr-cape-grad)" d="M200 152 C186 138 174 126 166 108 C158 94 155 82 156 64 L134 76 C146 60 150 44 154 30 C162 12 178 6 200 6 C222 6 238 12 246 30 C250 44 254 60 266 76 L244 64 C245 82 242 94 234 108 C226 126 214 138 200 152 C208 160 218 165 228 167 C270 140 314 104 364 64 C350 128 344 176 354 232 C366 300 368 380 356 452 C350 486 360 502 382 516 Q352 488 322 498 Q306 550 272 510 Q252 556 224 514 Q208 558 200 566 Q192 558 176 514 Q148 556 128 510 Q94 550 78 498 Q48 488 18 516 C40 502 50 486 44 452 C32 380 34 300 46 232 C56 176 50 128 36 64 C86 104 130 140 172 167 C182 165 192 160 200 152 Z"/>
          <ellipse class="dr-face-glow" cx="200" cy="86" rx="46" ry="58" fill="url(#dr-face-grad)"/>
          <path class="dr-silhouette-trim" d="M200 152 C186 138 174 126 166 108 C158 94 155 82 156 64 L134 76 C146 60 150 44 154 30 C162 12 178 6 200 6 C222 6 238 12 246 30 C250 44 254 60 266 76 L244 64 C245 82 242 94 234 108 C226 126 214 138 200 152 C208 160 218 165 228 167 C270 140 314 104 364 64 C350 128 344 176 354 232 C366 300 368 380 356 452 C350 486 360 502 382 516 Q352 488 322 498 Q306 550 272 510 Q252 556 224 514 Q208 558 200 566 Q192 558 176 514 Q148 556 128 510 Q94 550 78 498 Q48 488 18 516 C40 502 50 486 44 452 C32 380 34 300 46 232 C56 176 50 128 36 64 C86 104 130 140 172 167 C182 165 192 160 200 152 Z"/>
          <path class="dr-collar-line" d="M200 170 C168 192 128 202 84 198 M200 170 C232 192 272 202 316 198"/>
        </svg>

        <!-- Head: hairline + eyes live in the silhouette's face -->
        <div class="dr-head">
          <!-- Widow's-peak hairline (SVG brow over the eyes) -->
          <svg class="dr-hairline" viewBox="0 0 300 42" preserveAspectRatio="none" aria-hidden="true">
            <path d="M4 42 V14 Q70 0 118 10 Q140 14 150 31 Q160 14 182 10 Q230 0 296 14 V42 Q150 30 4 42 Z"/>
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
        </div>

        <!-- Track info -->
        <div class="dr-track-info">
          <span class="dr-title">—</span>
          <span class="dr-artist">—</span>
        </div>

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
