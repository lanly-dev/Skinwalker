import { clearShapeForDrag, isOnSkin, restoreShape } from './windowShape'

/**
 * The monster's body is the window's drag handle.
 *
 * The OS shape keeps clicks outside the painted body from reaching the window,
 * but it is lifted while a drag moves it: a shaped window repaints its region
 * a frame behind a programmatic move, so the plate smears against its own
 * outline. A plain rectangle moves as one piece, which is what the window did
 * before it was shaped.
 *
 * The drag starts only on painted pixels and leaves every control alone. A
 * skin body that is a `role="group"` for assistive tech can opt back in with
 * `data-window-drag`, so its grouping does not turn the plate into a dead
 * zone; controls inside it still keep their own gestures.
 */
export function installSkinDrag(): void {
  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement | null
    if (!target?.closest('.skin')) return
    // A modal panel (a skin's track board) owns the pointer while it is open.
    if (document.querySelector('[role="dialog"]:not([hidden])')) return
    // A control that already claimed the gesture (Frankenstein's stitched seek
    // scar, for one) keeps it; the window must not move under that drag.
    if (e.defaultPrevented) return
    if (target.closest('button, input, textarea, select, ol, ul, [role="button"], [role="slider"], [role="dialog"]')) {
      return
    }
    // A `role="group"` is a landmark around a control area (a seek region or a
    // cape zone), so pointers inside it stay with the group. A plate that opts
    // in with `data-window-drag` is different: there the group is only the
    // accessibility wrapper around the monster's own body, which is the drag
    // handle. Controls inside it are still turned away above.
    if (!target.closest('[data-window-drag]') && target.closest('[role="group"]')) return
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

    // A click that never moves must not touch the window: lifting the shape
    // exposes the whole rectangle for a frame. Start the drag after a few px.
    const START_PX = 4
    const startX = e.screenX
    const startY = e.screenY
    let started = false
    let ready: Promise<void> = Promise.resolve()
    let isReady = false
    // One window move per painted frame: sending a move per pointer event
    // queued them faster than the window could follow.
    const onMove = (ev: PointerEvent): void => {
      if (!started) {
        if (Math.hypot(ev.screenX - startX, ev.screenY - startY) < START_PX) return
        started = true
        // The window starts moving only after the buttons are hidden and the
        // shape is lifted; pointer movement meanwhile is accumulated below.
        ready = clearShapeForDrag().then(() => {
          api.beginWindowDrag?.()
          isReady = true
        })
      }
      dx += Math.round(ev.screenX - lastX)
      dy += Math.round(ev.screenY - lastY)
      lastX = ev.screenX
      lastY = ev.screenY
      if (!isReady || frame) return
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
      void ready.then(() => {
        flush()
        api.endWindowDrag?.()
        restoreShape()
      })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    e.preventDefault()
  })
}