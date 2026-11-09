/**
 * Player — owns state: playlist, current track index, shuffle/repeat.
 * Coordinates AudioEngine + active Skin. Pure logic, no DOM.
 */
import { AudioEngine } from '../audio/AudioEngine'
import type { Skin } from '../skins/Skin'

export interface Track {
  title: string
  artist: string
  url: string
}

export class Player {
  readonly audio: AudioEngine
  private tracks: Track[] = []
  private currentIndex = 0
  private activeSkin: Skin | null = null
  /** Last volume set (0–1). Skins initialise their slider from this so a
   *  mid-playback skin swap never resets the volume. */
  private volumeLevel = 0.8

  onTrackChange: ((track: Track, index: number) => void) | null = null

  constructor() {
    this.audio = new AudioEngine()
    this.audio.onEnded = () => this.next()
  }

  loadPlaylist(tracks: Track[]): void {
    this.tracks = tracks
  }

  get currentTrack(): Track | null {
    return this.tracks[this.currentIndex] ?? null
  }

  get trackCount(): number {
    return this.tracks.length
  }

  async playIndex(index: number): Promise<void> {
    if (index < 0 || index >= this.tracks.length) return
    this.currentIndex = index
    const track = this.tracks[index]
    await this.audio.resume()
    await this.audio.loadUrl(track.url)
    this.audio.play()
    this.onTrackChange?.(track, index)
  }

  togglePlayPause(): void {
    if (this.audio.isPlaying) {
      this.audio.pause()
    } else {
      if (this.audio.duration === 0 && this.tracks.length > 0) {
        void this.playIndex(this.currentIndex)
      } else {
        void this.audio.resume()
        this.audio.play()
      }
    }
  }

  next(): void {
    const next = (this.currentIndex + 1) % this.tracks.length
    void this.playIndex(next)
  }

  prev(): void {
    if (this.audio.currentTime > 3) {
      // restart current track if more than 3 s in
      this.audio.seek(0)
      return
    }
    const prev = (this.currentIndex - 1 + this.tracks.length) % this.tracks.length
    void this.playIndex(prev)
  }

  seek(fraction: number): void {
    this.audio.seek(fraction * this.audio.duration)
  }

  setVolume(fraction: number): void {
    this.volumeLevel = fraction
    this.audio.volume = fraction
  }

  get currentVolume(): number {
    return this.volumeLevel
  }

  mountSkin(skin: Skin): void {
    this.activeSkin?.unmount()
    this.activeSkin = skin
    skin.mount(this)
    // Re-notify the fresh skin of the current track so its title, artist
    // and playlist highlight survive a mid-playback swap (the callback is
    // assigned by the skin during mount).
    const track = this.currentTrack
    if (track && this.onTrackChange) {
      this.onTrackChange(track, this.currentIndex)
    }
  }

  /** Append tracks from the native file picker and notify the active skin */
  addTracks(newTracks: Track[]): void {
    this.tracks = [...this.tracks, ...newTracks]
    this.activeSkin?.onPlaylistUpdate?.()
  }

  get playlist(): readonly Track[] {
    return this.tracks
  }
}
