import { clearShapeForDrag, isOnSkin, restoreShape } from './windowShape'

/**
 * The monster's body is the titlebar.
 *
 * The OS shape keeps clicks outside the painted body from reaching the window,
 * but it is lifted while a drag moves it: a shaped window repaints its region
 * a frame behind a programmatic move, so the plate smears against its own
 * outline. A plain rectangle moves as one piece, which is what the window did
 * before it was shaped.
 *
 * The drag starts only on painted pixels and leaves every control alone.
 */
export function installSkinDrag(): void {
  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement | null
    if (!target?.closest('.skin')) return
    if (target.closest('button, input, textarea, select, ol, ul, [role="button"], [role="slider"], [role="group"]')) {
      return
    }
    if (!isOnSkin(e.clientX, e.clientY)) return
    const api = window.skinwalker
    if (!api?.dragWindow) return

    let lastX = e.screenX
    let lastY = e.screenY
    let dx = 0
    let dy = 0
    let frame = 0

    const flush = (): void => {
      if (frame) {
        cancelAnimationFrame(frame)
        frame = 0
      }
      if (!dx && !dy) return
      api.dragWindow({ mouseX: dx, mouseY: dy })
      dx = 0
      dy = 0
    }

    // One window move per painted frame: sending a move per pointer event
    // queued them faster than the window could follow.
    // A click that never moves must not touch the window: lifting the shape
    // exposes the whole rectangle for a frame. Start the drag after a few px.
    const START_PX = 4
    const startX = e.screenX
    const startY = e.screenY
    let started = false
    const onMove = (ev: PointerEvent): void => {
      if (!started) {
        if (Math.hypot(ev.screenX - startX, ev.screenY - startY) < START_PX) return
        started = true
        clearShapeForDrag()
        api.beginWindowDrag?.()
      }
      dx += Math.round(ev.screenX - lastX)
      dy += Math.round(ev.screenY - lastY)
      lastX = ev.screenX
      lastY = ev.screenY
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        flush()
      })
    }
    const onUp = (): void => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      if (!started) return
      flush()
      api.endWindowDrag?.()
      restoreShape()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    e.preventDefault()
  })
}