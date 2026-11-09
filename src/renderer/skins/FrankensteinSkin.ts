/**
 * FrankensteinSkin — skin #2.
 *
 * Anatomy → controls mapping:
 *   Bolts on neck (left/right) ── prev / next track
 *   Flat-top head ──────────────── live visualizer (voltage arcs across skull)
 *   Eyes (wide, stitched) ──────── play/pause toggle
 *   Stitched chest scar ────────── seek bar (scar length = progress)
 *   Hand (green, outstretched) ─── volume control
 *
 * All controls wired. Inline SVG art (stitched scar line, eyes, neck
 * bolts) rides the same class hooks as the wiring and CSS.
 */
import type { Skin } from './Skin'
import type { Player } from '../player/Player'

export class FrankensteinSkin implements Skin {
  readonly id = 'frankenstein'
  readonly label = 'Frankenstein'

  private container: HTMLElement | null = null
  private rafId = 0
  private freqData: Uint8Array<ArrayBuffer> | null = null
  private player: Player | null = null

  mount(player: Player): void {
    this.player = player
    const app = document.getElementById('app')!
    document.documentElement.dataset.skin = this.id

    this.container = document.createElement('div')
    this.container.className = 'skin frankenstein-skin'
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
      <div class="fr-body" aria-label="Frankenstein media player">

        <!-- Track info -->
        <div class="fr-track-info">
          <span class="fr-title">—</span>
          <span class="fr-artist">—</span>
        </div>

        <!-- Skull top = visualizer (voltage arcs) -->
        <div class="fr-skull" aria-hidden="true">
          <canvas class="fr-viz" width="256" height="72"></canvas>
          <svg class="fr-stitches" viewBox="0 0 300 12" preserveAspectRatio="none">
            <path class="fr-stitch-line" d="M4 6 H296"/>
            <path class="fr-stitch-ticks" d="M24 1 V11 M60 1 V11 M96 1 V11 M132 1 V11 M168 1 V11 M204 1 V11 M240 1 V11 M276 1 V11"/>
          </svg>
        </div>

        <!-- Eyes = play/pause -->
        <button class="fr-eyes" aria-label="Play / Pause" title="Play / Pause">
          <span class="fr-eye left" aria-hidden="true">
            <svg viewBox="0 0 36 36">
              <path class="fr-sclera" d="M3 18 Q18 5 33 18 Q18 29 3 18 Z"/>
              <circle class="fr-iris" cx="18" cy="17" r="6.5"/>
              <circle class="fr-pupil" cx="18" cy="17" r="2.8"/>
            </svg>
          </span>
          <span class="fr-eye right" aria-hidden="true">
            <svg viewBox="0 0 36 36">
              <path class="fr-sclera" d="M3 18 Q18 5 33 18 Q18 29 3 18 Z"/>
              <circle class="fr-iris" cx="18" cy="17" r="6.5"/>
              <circle class="fr-pupil" cx="18" cy="17" r="2.8"/>
            </svg>
          </span>
        </button>

        <!-- Neck bolts = prev / next -->
        <div class="fr-controls">
          <button class="fr-prev" aria-label="Previous track"><svg class="fr-bolt" viewBox="0 0 20 24" aria-hidden="true"><polygon points="13,0 3,14 10.5,14 8.5,24 19,9 11.5,9"/></svg>◀</button>
          <button class="fr-next" aria-label="Next track">▶<svg class="fr-bolt" viewBox="0 0 20 24" aria-hidden="true"><polygon points="13,0 3,14 10.5,14 8.5,24 19,9 11.5,9"/></svg></button>
        </div>

        <!-- Chest scar = seek bar -->
        <div class="fr-seek-region" role="group" aria-label="Seek">
          <input class="fr-seek" type="range" min="0" max="1000" value="0"
                 aria-label="Seek" step="1" />
          <span class="fr-time">0:00 / 0:00</span>
        </div>

        <!-- Hand = volume -->
        <div class="fr-volume-region" role="group" aria-label="Volume">
          <span class="fr-hand" aria-hidden="true">🖐</span>
          <input class="fr-volume" type="range" min="0" max="100" value="80"
                 aria-label="Volume" step="1" />
        </div>

        <!-- Playlist -->
        <ol class="fr-playlist" aria-label="Playlist"></ol>

      </div>
    `
  }

  // ── Events ───────────────────────────────────────────────────────────────────

  private bindEvents(): void {
    const c = this.container!
    const p = this.player!

    // Eyes → play/pause
    c.querySelector('.fr-eyes')!.addEventListener('click', () => {
      p.togglePlayPause()
      this.updatePlayState()
    })

    // Seek (chest scar)
    const seekEl = c.querySelector<HTMLInputElement>('.fr-seek')!
    seekEl.addEventListener('input', () => {
      p.seek(Number(seekEl.value) / 1000)
    })

    // Volume (hand)
    const volEl = c.querySelector<HTMLInputElement>('.fr-volume')!
    volEl.addEventListener('input', () => p.setVolume(Number(volEl.value) / 100))
    // Init from the player's current volume so a skin swap keeps it
    volEl.value = String(Math.round(p.currentVolume * 100))
    p.setVolume(Number(volEl.value) / 100)

    // Bolts → prev / next
    c.querySelector('.fr-prev')!.addEventListener('click', () => p.prev())
    c.querySelector('.fr-next')!.addEventListener('click', () => p.next())

    // Track change
    p.onTrackChange = (track, idx) => {
      const titleEl = c.querySelector<HTMLElement>('.fr-title')
      const artistEl = c.querySelector<HTMLElement>('.fr-artist')
      if (titleEl) titleEl.textContent = track.title
      if (artistEl) artistEl.textContent = track.artist
      this.highlightPlaylistItem(idx)
    }

    this.buildPlaylist()
  }

  private buildPlaylist(): void {
    const p = this.player!
    const ol = this.container!.querySelector<HTMLOListElement>('.fr-playlist')!
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
    const ol = this.container?.querySelector('.fr-playlist')
    if (!ol) return
    ol.querySelectorAll('li').forEach((li, i) => {
      li.classList.toggle('active', i === idx)
      li.setAttribute('aria-current', i === idx ? 'true' : 'false')
    })
  }

  private updatePlayState(): void {
    const eyes = this.container?.querySelector('.fr-eyes')
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
    const canvas = this.container?.querySelector<HTMLCanvasElement>('.fr-viz')
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    this.player.audio.getFrequencyData(this.freqData)

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const barW = canvas.width / this.freqData.length
    for (let i = 0; i < this.freqData.length; i++) {
      const h = (this.freqData[i] / 255) * canvas.height
      // Electric green → yellow voltage arcs
      ctx.fillStyle = `hsl(${100 + i * 0.5}, 90%, ${45 + h / 5}%)`
      ctx.fillRect(i * barW, canvas.height - h, barW - 1, h)
    }
  }

  private updateSeek(): void {
    if (!this.player || !this.container) return
    const seek   = this.container.querySelector<HTMLInputElement>('.fr-seek')
    const timeEl = this.container.querySelector<HTMLElement>('.fr-time')
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
