/**
 * AudioEngine — wraps Web Audio API.
 * Single AudioContext shared across the app lifetime.
 * Provides an AnalyserNode that skins subscribe to for visualizer data.
 */
export class AudioEngine {
  private ctx: AudioContext
  private source: AudioBufferSourceNode | null = null
  private gainNode: GainNode
  readonly analyser: AnalyserNode

  /** Seconds into the current track when playback started */
  private startOffset = 0
  /** AudioContext time when play() was last called */
  private startTime = 0

  private buffer: AudioBuffer | null = null
  private _isPlaying = false

  onEnded: (() => void) | null = null

  constructor() {
    this.ctx = new AudioContext()

    this.gainNode = this.ctx.createGain()
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 256

    this.gainNode.connect(this.analyser)
    this.analyser.connect(this.ctx.destination)
  }

  get isPlaying() {
    return this._isPlaying
  }

  /** Current playback position in seconds */
  get currentTime(): number {
    if (!this._isPlaying) return this.startOffset
    return this.startOffset + (this.ctx.currentTime - this.startTime)
  }

  get duration(): number {
    return this.buffer?.duration ?? 0
  }

  get volume(): number {
    return this.gainNode.gain.value
  }

  set volume(v: number) {
    this.gainNode.gain.value = Math.max(0, Math.min(1, v))
  }

  async loadUrl(url: string): Promise<void> {
    const data = await this.readBytes(url)
    this.buffer = await this.ctx.decodeAudioData(data)
    this.startOffset = 0
  }

  /** Chromium refuses fetch() on file:// URLs, so local tracks (bundled demo
   *  files in a packaged build, and everything the native picker returns) are
   *  read through the preload bridge instead. */
  private async readBytes(url: string): Promise<ArrayBuffer> {
    const absolute = new URL(url, window.location.href)
    if (absolute.protocol === 'file:') {
      const bytes = await window.skinwalker?.readAudioFile(absolute.href)
      if (bytes) return bytes
    }
    const res = await fetch(absolute.href)
    if (!res.ok) throw new Error(`Cannot load audio: ${absolute.href}`)
    return res.arrayBuffer()
  }

  play(offset?: number): void {
    if (!this.buffer) return
    this.stop()

    if (offset !== undefined) this.startOffset = offset

    this.source = this.ctx.createBufferSource()
    this.source.buffer = this.buffer
    this.source.connect(this.gainNode)
    this.source.onended = () => {
      if (this._isPlaying) {
        this._isPlaying = false
        this.startOffset = 0
        this.onEnded?.()
      }
    }

    this.startTime = this.ctx.currentTime
    this.source.start(0, this.startOffset)
    this._isPlaying = true
  }

  pause(): void {
    if (!this._isPlaying) return
    this.startOffset = this.currentTime
    this.source?.stop()
    this._isPlaying = false
  }

  stop(): void {
    if (this.source) {
      this.source.onended = null
      try { this.source.stop() } catch { /* already stopped */ }
      this.source = null
    }
    this._isPlaying = false
  }

  seek(seconds: number): void {
    const wasPlaying = this._isPlaying
    this.stop()
    this.startOffset = Math.max(0, Math.min(seconds, this.duration))
    if (wasPlaying) this.play()
  }

  /** Resume a suspended AudioContext (browser autoplay policy) */
  async resume(): Promise<void> {
    if (this.ctx.state === 'suspended') await this.ctx.resume()
  }

  /** Fill a Uint8Array with frequency data for the visualizer */
  getFrequencyData(out: Uint8Array<ArrayBuffer>): void {
    this.analyser.getByteFrequencyData(out)
  }

  /** Fill a Uint8Array with time-domain data for RMS energy readouts */
  getWaveformData(out: Uint8Array<ArrayBuffer>): void {
    this.analyser.getByteTimeDomainData(out)
  }
}
