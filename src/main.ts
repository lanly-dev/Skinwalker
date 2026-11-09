/**
 * main.ts — entry point.
 * Bootstraps Player, loads demo playlist, mounts default skin,
 * and renders the skin-switcher overlay.
 */
import { Player, type Track } from './player/Player'
import { SKINS } from './skins/index'
import './style.css'

// ── Demo playlist (royalty-free / bundled tracks) ────────────────────────────
// Replace paths with real files placed in public/tracks/
const DEMO_TRACKS: Track[] = [
  { title: 'Haunted Hollow', artist: 'Skinwalker Demo', url: '/tracks/demo-01.mp3' },
  { title: 'Midnight Howl',  artist: 'Skinwalker Demo', url: '/tracks/demo-02.mp3' },
  { title: 'Crypt Groove',   artist: 'Skinwalker Demo', url: '/tracks/demo-03.mp3' },
]

// ── Bootstrap ────────────────────────────────────────────────────────────────
const player = new Player()
player.loadPlaylist(DEMO_TRACKS)

// Mount first skin
let activeSkinIndex = 0
player.mountSkin(SKINS[activeSkinIndex])

// ── Skin switcher ─────────────────────────────────────────────────────────────
function renderSwitcher(): void {
  const existing = document.getElementById('skin-switcher')
  if (existing) existing.remove()

  const switcher = document.createElement('nav')
  switcher.id = 'skin-switcher'
  switcher.setAttribute('aria-label', 'Monster skin selector')

  SKINS.forEach((skin, i) => {
    const btn = document.createElement('button')
    btn.textContent = skin.label
    btn.setAttribute('aria-pressed', String(i === activeSkinIndex))
    btn.classList.toggle('active', i === activeSkinIndex)
    btn.addEventListener('click', () => {
      if (i === activeSkinIndex) return
      activeSkinIndex = i
      player.mountSkin(skin)
      renderSwitcher() // re-render to update aria-pressed
    })
    switcher.appendChild(btn)
  })

  document.body.appendChild(switcher)
}

renderSwitcher()
