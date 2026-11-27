/**
 * Native folder picker -> playlist.
 *
 * Every skin's "Open folder" control and the floating pill use this. The
 * folder's audio files (subfolders included, sorted by the main process)
 * replace the playlist.
 */
import type { Player, Track } from './player/Player'

export async function openFolder(player: Player): Promise<void> {
  const api = window.skinwalker
  if (!api?.openAudioFolder) return
  const urls = await api.openAudioFolder()
  if (!urls.length) return
  const tracks: Track[] = urls.map((url) => ({
    title: trackTitle(url),
    artist: 'Local',
    url,
  }))
  await player.replacePlaylist(tracks)
}
/** Filename without its extension. Decoding is best-effort: a literal '%' in
 *  a name ("100%.mp3") is not a URI escape, and letting decodeURIComponent
 *  throw there aborted the whole selection before it reached the playlist. */
function trackTitle(url: string): string {
  const file = url.split('/').pop() ?? url
  let name = file
  try {
    name = decodeURIComponent(file)
  } catch {
    name = file
  }
  return name.replace(/\.[^.]+$/, '')
}
