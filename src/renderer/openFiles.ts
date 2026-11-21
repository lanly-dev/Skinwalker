/**
 * Native file picker → playlist.
 *
 * Both the floating "+ Add files" button and the skins' folder tools use this,
 * so the track shape stays the same whichever affordance opens the dialog.
 */
import type { Player, Track } from './player/Player'

export async function openLocalFiles(player: Player): Promise<void> {
  const api = window.skinwalker
  if (!api?.openAudioFiles) return
  const urls = await api.openAudioFiles()
  if (!urls.length) return
  const tracks: Track[] = urls.map((url) => ({
    title: trackTitle(url),
    artist: 'Local',
    url,
  }))
  player.addTracks(tracks)
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
