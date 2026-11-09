/**
 * WerewolfSkin — design flagship skin.
 *
 * Anatomy → controls mapping:
 *   Mouth (jaw gap) ────────── live visualizer bars (AnalyserNode)
 *   Claws ──────────────────── seek bar (left claw = progress, right = scrub)
 *   Chest fur ripple ────────── volume control
 *   Eye glow pulse ──────────── play/pause toggle
 *   Ear twitch ──────────────── prev / next track
 *
 * This is a stub — layout and art ship in a later task.
 * The wiring below is real and functional; replace inner HTML with full SVG art.
 */
import type { Skin } from './Skin'
import type { Player } from '../player/Player'

export class WerewolfSkin implements Skin {
  readonly id = 'werewolf'
  readonly label = 'Werewolf'

  private container: HTMLElement | null = null
  private rafId = 0
  private freqData: Uint8Array<ArrayBuffer> | null = null
  private player: Player | null = null

  mount(player: Player): void {
    this.player = player
    const app = document.getElementById('app')!
    document.documentElement.dataset.skin = this.id

    this.container = document.createElement('div')
    this.container.className = 'skin werewolf-skin'
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

  // ── DOM ─────────────────────────────────────────────────────────────────────

  private template(): string {
    return /* html */ `
      <div class="ww-body" aria-label="Werewolf media player">

        <!-- Track info -->
        <div class="ww-track-info">
          <span class="ww-title">—</span>
          <span class="ww-artist">—</span>
        </div>

        <!-- Eyes = play/pause -->
        <button class="ww-eyes" aria-label="Play / Pause" title="Play / Pause">
          <span class="ww-eye left" aria-hidden="true"></span>
          <span class="ww-eye right" aria-hidden="true"></span>
        </button>

        <!-- Mouth = visualizer -->
        <div class="ww-mouth" aria-hidden="true">
          <canvas class="ww-viz" width="256" height="64"></canvas>
        </div>

        <!-- Claws = seek bar -->
        <div class="ww-seek-region" role="group" aria-label="Seek">
          <input class="ww-seek" type="range" min="0" max="1000" value="0"
                 aria-label="Seek" step="1" />
          <span class="ww-time">0:00 / 0:00</span>
        </div>

        <!-- Chest = volume -->
        <div class="ww-volume-region" role="group" aria-label="Volume">
          <input class="ww-volume" type="range" min="0" max="100" value="80"
                 aria-label="Volume" step="1" />
        </div>

        <!-- Ears = prev / next -->
        <div class="ww-controls">
          <button class="ww-prev" aria-label="Previous track">◀◀</button>
          <button class="ww-next" aria-label="Next track">▶▶</button>
        </div>

        <!-- Playlist -->
        <ol class="ww-playlist" aria-label="Playlist"></ol>

      </div>
    `
  }

  // ── Events ──────────────────────────────────────────────────────────────────

  private bindEvents(): void {
    const c = this.container!
    const p = this.player!

    // Eyes → play/pause
    c.querySelector('.ww-eyes')!.addEventListener('click', () => {
      p.togglePlayPause()
      this.updatePlayState()
    })

    // Seek range
    const seekEl = c.querySelector<HTMLInputElement>('.ww-seek')!
    seekEl.addEventListener('input', () => {
      p.seek(Number(seekEl.value) / 1000)
    })

    // Volume range
    const volEl = c.querySelector<HTMLInputElement>('.ww-volume')!
    volEl.addEventListener('input', () => {
      p.setVolume(Number(volEl.value) / 100)
    })
    // init volume
    p.setVolume(Number(volEl.value) / 100)

    // Prev / Next (ears)
    c.querySelector('.ww-prev')!.addEventListener('click', () => p.prev())
    c.querySelector('.ww-next')!.addEventListener('click', () => p.next())

    // Track change → update info + playlist highlight
    p.onTrackChange = (track, idx) => {
      const titleEl = c.querySelector<HTMLElement>('.ww-title')
      const artistEl = c.querySelector<HTMLElement>('.ww-artist')
      if (titleEl) titleEl.textContent = track.title
      if (artistEl) artistEl.textContent = track.artist
      this.highlightPlaylistItem(idx)
    }

    // Playlist items
    this.buildPlaylist()
  }

  private buildPlaylist(): void {
    const p = this.player!
    const ol = this.container!.querySelector<HTMLOListElement>('.ww-playlist')!
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
    const ol = this.container?.querySelector('.ww-playlist')
    if (!ol) return
    ol.querySelectorAll('li').forEach((li, i) => {
      li.classList.toggle('active', i === idx)
      li.setAttribute('aria-current', i === idx ? 'true' : 'false')
    })
  }

  private updatePlayState(): void {
    const eyes = this.container?.querySelector('.ww-eyes')
    if (!eyes) return
    eyes.classList.toggle('playing', this.player?.audio.isPlaying ?? false)
  }

  // ── RAF loop ─────────────────────────────────────────────────────────────────

  private loop(): void {
    this.rafId = requestAnimationFrame(() => this.loop())
    this.drawVisualizer()
    this.updateSeek()
    this.updatePlayState()
  }

  private drawVisualizer(): void {
    if (!this.freqData || !this.player) return
    const canvas = this.container?.querySelector<HTMLCanvasElement>('.ww-viz')
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    this.player.audio.getFrequencyData(this.freqData)

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const barW = canvas.width / this.freqData.length
    for (let i = 0; i < this.freqData.length; i++) {
      const h = (this.freqData[i] / 255) * canvas.height
      ctx.fillStyle = `hsl(${30 + i * 2}, 90%, ${40 + h / 4}%)`
      ctx.fillRect(i * barW, canvas.height - h, barW - 1, h)
    }
  }

  private updateSeek(): void {
    if (!this.player || !this.container) return
    const seek = this.container.querySelector<HTMLInputElement>('.ww-seek')
    const timeEl = this.container.querySelector<HTMLElement>('.ww-time')
    const dur = this.player.audio.duration
    const cur = this.player.audio.currentTime
    if (seek && dur > 0) {
      seek.value = String(Math.round((cur / dur) * 1000))
    }
    if (timeEl) {
      timeEl.textContent = `${fmt(cur)} / ${fmt(dur)}`
    }
  }
}

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
