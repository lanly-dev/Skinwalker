/**
 * Skin — interface every monster skin must implement.
 *
 * mount()   — inject DOM into #app, wire events to player, start RAF loop
 * unmount() — remove DOM, cancel RAF, tear down listeners
 *
 * The skin owns its own DOM. It is the only thing that touches #app content.
 */
import type { Player } from '../player/Player'

export interface Skin {
  readonly id: string        // e.g. 'dracula'
  readonly label: string     // e.g. 'Werewolf'
  mount(player: Player): void
  unmount(): void
  /** Called when tracks are added mid-session so the skin can refresh its playlist UI */
  onPlaylistUpdate?(): void
}
