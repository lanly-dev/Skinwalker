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
    const res = await fetch(url)
    const arrayBuffer = await res.arrayBuffer()
    this.buffer = await this.ctx.decodeAudioData(arrayBuffer)
    this.startOffset = 0
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
}
