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
    title: decodeURIComponent(url.split('/').pop() ?? url).replace(/\.[^.]+$/, ''),
    artist: 'Local',
    url,
  }))
  player.addTracks(tracks)
}
