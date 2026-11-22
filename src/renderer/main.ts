/**
 * Renderer entry point.
 * Bootstraps Player, loads demo playlist, mounts default skin,
 * and renders the window controls.
 */
import { Player, type Track } from './player/Player'
import { SKINS } from './skins/index'
import { installShapeResize } from './windowShape'
import { installSkinDrag } from './skinDrag'
import { openLocalFiles } from './openFiles'
import './style.css'

// ── Demo playlist ─────────────────────────────────────────────────────────────
// These ship with the app from public/tracks/. At runtime you can also add
// local files via the native file picker.
const DEMO_TRACKS: Track[] = [
  { title: 'Nocturne In Blood',   artist: 'Bathory • Eternal Night',        url: './tracks/nocturne-in-blood.wav' },
  { title: 'Coffin Dream',        artist: 'Synthesized Ambient • Demo II',  url: './tracks/coffin-dream.wav' },
  { title: 'Widow’s Kiss',        artist: 'Synthesized Ambient • Demo III', url: './tracks/widows-kiss.wav' },
  { title: 'Baba Yaga',           artist: 'Kevin MacLeod',                  url: './tracks/baba-yaga.mp3' },
  { title: 'Darkling',            artist: 'Kevin MacLeod',                  url: './tracks/darkling.mp3' },
  { title: 'Thief in the Night',  artist: 'Kevin MacLeod',                  url: './tracks/thief-in-the-night.mp3' },
]

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const player = new Player()
player.loadPlaylist(DEMO_TRACKS)

player.setSkins(SKINS)
player.mountSkin(SKINS[0])
installSkinDrag()
installShapeResize()


// ── Native file open ──────────────────────────────────────────────────────────
function renderOpenButton(): void {
  const btn = document.createElement('button')
  btn.id = 'open-files'
  btn.textContent = '+ Add files'
  btn.setAttribute('aria-label', 'Add local audio files')
  btn.addEventListener('click', () => void openLocalFiles(player))
  document.body.appendChild(btn)
}

renderOpenButton()
