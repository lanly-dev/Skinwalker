/**
 * Renderer entry point.
 * Bootstraps Player, loads demo playlist, mounts default skin,
 * and renders the window controls.
 */
import { Player, type Track } from './player/Player'
import { SKINS } from './skins/index'
import { installShapeResize } from './windowShape'
import { installSkinDrag } from './skinDrag'
import { openFolder } from './openFiles'
import { loadLastSkinId } from './lastSkin'
import './style.css'

// ── Demo playlist ─────────────────────────────────────────────────────────────
// These ship with the app from public/tracks/. At runtime you can also add
// local files via the native file picker.
const DEMO_TRACKS: Track[] = [
  { title: 'Nocturne In Blood',   artist: 'Bathory • Eternal Night',        url: './tracks/nocturne-in-blood.wav' },
  { title: 'The Extraordinarily Long Ballad of the Midnight Count', artist: 'Synthesized Ambient • Demo II',  url: './tracks/coffin-dream.wav' },
  { title: 'Widow’s Kiss',        artist: 'Synthesized Ambient • Demo III', url: './tracks/widows-kiss.wav' },
  { title: 'Baba Yaga',           artist: 'Kevin MacLeod',                  url: './tracks/baba-yaga.mp3' },
  { title: 'Darkling',            artist: 'Kevin MacLeod',                  url: './tracks/darkling.mp3' },
  { title: 'Thief in the Night',  artist: 'Kevin MacLeod',                  url: './tracks/thief-in-the-night.mp3' },
]

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const player = new Player()
player.loadPlaylist(DEMO_TRACKS)

player.setSkins(SKINS)
// Reopen on the skin that was active last time; fall back to the first one.
const lastId = loadLastSkinId()
player.mountSkin(SKINS.find((skin) => skin.id === lastId) ?? SKINS[0])
installSkinDrag()
installShapeResize()


// ── Native file open ──────────────────────────────────────────────────────────
function renderOpenButton(): void {
  const btn = document.createElement('button')
  btn.id = 'open-files'
  btn.textContent = 'Open folder'
  btn.setAttribute('aria-label', 'Open a music folder')
  btn.addEventListener('click', () => void openFolder(player))
  document.body.appendChild(btn)
}

renderOpenButton()
