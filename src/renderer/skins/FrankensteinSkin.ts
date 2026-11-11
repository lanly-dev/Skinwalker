/**
 * FrankensteinSkin — skin #2, IMAGE-FRAME pass.
 *
 * The approved character artwork IS the frame: the transparent plate
 * (assets/frankenstein-frame.webp) fills the frameless window and the
 * painted elements are the controls. Separated layers (extracted from
 * the plate by color segmentation, full-canvas so they stack
 * pixel-exact): the glowing eyes and the brass dial the hand holds.
 *
 * Anatomy → controls mapping:
 *   Forehead EQ blocks ─────── live visualizer (AnalyserNode)
 *   Eyes (glow layers) ─────── play/pause toggle (layers pulse while playing)
 *   Neck bolts (L/R) ───────── prev / next track
 *   Chest scar line ────────── seek bar (transparent track over the scar)
 *   Brass dial in hand ─────── volume (drag / wheel / arrows; layer rotates)
 */
import type { Skin } from './Skin'
import type { Player } from '../player/Player'
import framePlate from '../assets/frankenstein-frame.webp'
import eyeLeftLayer from '../assets/frankenstein-eye-left.png'
import eyeRightLayer from '../assets/frankenstein-eye-right.png'
import dialLayer from '../assets/frankenstein-dial.png'

export class FrankensteinSkin implements Skin {
  readonly id = 'frankenstein'
  readonly label = 'Frankenstein'
  readonly shapeImage = framePlate

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
    this.container.style.setProperty('--fr-frame-url', `url(${framePlate})`)
    this.container.style.setProperty('--fr-eye-left-url', `url(${eyeLeftLayer})`)
    this.container.style.setProperty('--fr-eye-right-url', `url(${eyeRightLayer})`)
    this.container.style.setProperty('--fr-dial-url', `url(${dialLayer})`)
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
      <div class="fr-body" role="img" aria-label="Frankenstein media player">
        <img class="fr-layer fr-eye-layer left" alt="" draggable="false" />
        <img class="fr-layer fr-eye-layer right" alt="" draggable="false" />
        <img class="fr-layer fr-dial-layer" alt="" draggable="false" />

        <!-- Eyes = play/pause -->
        <button class="fr-eyes" aria-label="Play / Pause" title="Play / Pause"></button>
        <div class="fr-eye-glow" aria-hidden="true"></div>

        <!-- Track info over the upper chest -->
        <div class="fr-track-info">
          <span class="fr-title">—</span>
          <span class="fr-artist">—</span>
        </div>

        <!-- Forehead = visualizer -->
        <div class="fr-viz-panel" aria-hidden="true">
          <canvas class="fr-viz" width="352" height="176"></canvas>
        </div>

        <!-- Bolts = prev / next -->
        <button class="fr-prev" aria-label="Previous track" title="Previous track"></button>
        <button class="fr-next" aria-label="Next track" title="Next track"></button>

        <!-- Chest scar = seek -->
        <div class="fr-seek-region" role="group" aria-label="Seek">
          <input class="fr-seek" type="range" min="0" max="1000" value="0"
                 aria-label="Seek" step="1" />
          <span class="fr-time">0:00 / 0:00</span>
        </div>

        <!-- Brass dial = volume (drag rotates the dial layer) -->
        <div class="fr-dial" role="slider" tabindex="0"
             aria-label="Volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="80"></div>

        <!-- Playlist -->
        <ol class="fr-playlist" aria-label="Playlist"></ol>
      </div>
    `
  }

  // ── Events ───────────────────────────────────────────────────────────────────

  private bindEvents(): void {
    const c = this.container!
    const p = this.player!

    c.querySelector('.fr-eyes')!.addEventListener('click', () => {
      p.togglePlayPause()
      this.updatePlayState()
    })

    const seekEl = c.querySelector<HTMLInputElement>('.fr-seek')!
    seekEl.addEventListener('input', () => p.seek(Number(seekEl.value) / 1000))

    // Volume: the brass dial. Drag horizontally, wheel, or arrow keys.
    const dialEl = c.querySelector<HTMLElement>('.fr-dial')!
    const dialLayerEl = c.querySelector<HTMLElement>('.fr-dial-layer')!
    let vol = p.currentVolume
    const applyVolume = (v: number): void => {
      vol = Math.min(1, Math.max(0, v))
      p.setVolume(vol)
      dialLayerEl.style.transform = `rotate(${-135 + vol * 270}deg)`
      dialEl.setAttribute('aria-valuenow', String(Math.round(vol * 100)))
    }
    applyVolume(vol)

    let dragging = false
    let startX = 0
    let startVol = 0
    dialEl.addEventListener('pointerdown', (e) => {
      dragging = true
      startX = e.clientX
      startVol = vol
      dialEl.setPointerCapture(e.pointerId)
    })
    dialEl.addEventListener('pointermove', (e) => {
      if (dragging) applyVolume(startVol + (e.clientX - startX) / 140)
    })
    dialEl.addEventListener('pointerup', () => { dragging = false })
    dialEl.addEventListener('wheel', (e) => {
      e.preventDefault()
      applyVolume(vol + (e.deltaY < 0 ? 0.05 : -0.05))
    }, { passive: false })
    dialEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { applyVolume(vol + 0.05); e.preventDefault() }
      if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { applyVolume(vol - 0.05); e.preventDefault() }
    })

    c.querySelector('.fr-prev')!.addEventListener('click', () => p.prev())
    c.querySelector('.fr-next')!.addEventListener('click', () => p.next())

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
    const bars = 24
    const barW = canvas.width / bars
    for (let i = 0; i < bars; i++) {
      const v = this.freqData[Math.floor((i / bars) * this.freqData.length)] / 255
      const h = Math.max(4, v * canvas.height)
      ctx.fillStyle = `hsl(130, 90%, ${38 + v * 30}%)`
      ctx.fillRect(i * barW + 1.5, canvas.height - h, barW - 3, h)
    }
  }

  private updateSeek(): void {
    if (!this.player || !this.container) return
    const seek = this.container.querySelector<HTMLInputElement>('.fr-seek')
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
