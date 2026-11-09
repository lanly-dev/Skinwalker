/**
 * Renderer entry point.
 * Bootstraps Player, loads demo playlist, mounts default skin,
 * and renders the skin-switcher + window controls.
 */
import { Player, type Track } from './player/Player'
import { SKINS } from './skins/index'
import './style.css'

// ── Demo playlist ─────────────────────────────────────────────────────────────
// Drop royalty-free .mp3s into resources/tracks/ — they ship with the app.
// At runtime you can also add local files via the native file picker.
const DEMO_TRACKS: Track[] = [
  { title: 'Haunted Hollow', artist: 'Skinwalker Demo', url: './tracks/demo-01.mp3' },
  { title: 'Midnight Howl',  artist: 'Skinwalker Demo', url: './tracks/demo-02.mp3' },
  { title: 'Crypt Groove',   artist: 'Skinwalker Demo', url: './tracks/demo-03.mp3' },
]

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const player = new Player()
player.loadPlaylist(DEMO_TRACKS)

let activeSkinIndex = 0
player.mountSkin(SKINS[activeSkinIndex])

// ── Window controls (frameless) ───────────────────────────────────────────────
function renderWindowControls(): void {
  const bar = document.getElementById('titlebar')!
  bar.innerHTML = ''

  // Drag region — lets users move the frameless window
  bar.addEventListener('mousedown', (e) => {
    if ((e.target as HTMLElement).closest('button')) return
    let lastX = e.screenX
    let lastY = e.screenY
    const onMove = (ev: MouseEvent) => {
      window.skinwalker.dragWindow({ mouseX: ev.screenX - lastX, mouseY: ev.screenY - lastY })
      lastX = ev.screenX
      lastY = ev.screenY
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  })

  const btnMin  = btn('─', 'Minimize', () => window.skinwalker.minimize())
  const btnMax  = btn('□', 'Maximize', () => window.skinwalker.maximize())
  const btnClose = btn('✕', 'Close',   () => window.skinwalker.close())
  btnClose.classList.add('close')
  bar.append(btnMin, btnMax, btnClose)
}

function btn(label: string, ariaLabel: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button')
  b.textContent = label
  b.setAttribute('aria-label', ariaLabel)
  b.addEventListener('click', onClick)
  return b
}

renderWindowControls()

// ── Skin switcher ─────────────────────────────────────────────────────────────
function renderSwitcher(): void {
  const existing = document.getElementById('skin-switcher')
  if (existing) existing.remove()

  const nav = document.createElement('nav')
  nav.id = 'skin-switcher'
  nav.setAttribute('aria-label', 'Monster skin selector')

  SKINS.forEach((skin, i) => {
    const b = document.createElement('button')
    b.textContent = skin.label
    b.setAttribute('aria-pressed', String(i === activeSkinIndex))
    b.classList.toggle('active', i === activeSkinIndex)
    b.addEventListener('click', () => {
      if (i === activeSkinIndex) return
      activeSkinIndex = i
      player.mountSkin(skin)
      renderSwitcher()
    })
    nav.appendChild(b)
  })

  document.body.appendChild(nav)
}

renderSwitcher()

// ── Native file open ──────────────────────────────────────────────────────────
function renderOpenButton(): void {
  const btn = document.createElement('button')
  btn.id = 'open-files'
  btn.textContent = '+ Add files'
  btn.setAttribute('aria-label', 'Add local audio files')
  btn.addEventListener('click', async () => {
    const urls = await window.skinwalker.openAudioFiles()
    if (!urls.length) return
    const newTracks: Track[] = urls.map((url) => ({
      title: decodeURIComponent(url.split('/').pop() ?? url).replace(/\.[^.]+$/, ''),
      artist: 'Local',
      url,
    }))
    player.addTracks(newTracks)
  })
  document.body.appendChild(btn)
}

renderOpenButton()
