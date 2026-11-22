/**
 * Window shaping.
 *
 * A native window is always a rectangle: transparent pixels still receive
 * clicks and drags. Two things narrow that down:
 *   1. the OS window shape (setShape, Windows/Linux) follows the plate's
 *      painted silhouette plus its aura, so everything outside falls through
 *      to the desktop;
 *   2. isOnSkin() lets the drag handler start only on painted pixels.
 *
 * The mask is sampled at half resolution — the aura makes a 2px step
 * invisible, and it keeps the rect list (and therefore the OS region) small.
 */

type Rect = { x: number; y: number; width: number; height: number }

/** Alpha at or below this is outside the painted body. */
const SHARP_ALPHA = 24
/** The aura is faint by design; this is where it is effectively invisible. */
const GLOW_ALPHA = 8
/** Shape mask scale: 2 means one cell covers a 2×2 CSS-pixel block. */
const SCALE = 2

let mask: Uint8Array | null = null
let maskW = 0
let maskH = 0
let source: string | null = null
let resizeTimer: number | undefined
/** The silhouette currently applied, so a drag can lift it and put it back. */
let lastRects: Rect[] = []
/** Viewport the current rects were sampled from. The main process scales the
 *  region from this size to the window's actual size, so a resize between
 *  sampling and applying can never cut bands out of the silhouette. */
let lastFrom: { width: number; height: number } | null = null

function send(rects: Rect[], from = lastFrom ?? { width: window.innerWidth, height: window.innerHeight }): void {
  lastRects = rects
  lastFrom = from
  window.skinwalker?.setWindowShape?.(rects, from)
}

/** The generic window bar and the add-files pill sit outside the silhouette, so the shape
 *  clips them. While the shape is lifted for a drag the whole rectangle shows, so hide them. */
function setGenericChromeHidden(hidden: boolean): void {
  for (const id of ['titlebar', 'open-files']) {
    const el = document.getElementById(id)
    if (el) el.style.visibility = hidden ? 'hidden' : ''
  }
}

/**
 * Drop the OS region while the window moves. A shaped window can repaint its
 * region a frame behind a programmatic move, which makes the plate slide
 * against its own outline; a plain rectangle moves as one piece.
 */
export function clearShapeForDrag(): Promise<void> {
  // Hide first and let two frames paint, so the rectangle that appears when
  // the region is lifted never contains the buttons.
  setGenericChromeHidden(true)
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (lastRects.length) window.skinwalker?.setWindowShape?.([], lastFrom ?? undefined)
      resolve()
    }))
  })
}

/** Put the silhouette back once the drag ends. */
export function restoreShape(): void {
  if (lastRects.length) window.skinwalker?.setWindowShape?.(lastRects, lastFrom ?? undefined)
  // The OS applies the region a moment after the message; show the generic
  // chrome only once the silhouette is back, or it flashes in the rectangle.
  window.setTimeout(() => setGenericChromeHidden(false), 150)
}

/** True when the point sits on the painted body of the active skin. */
export function isOnSkin(clientX: number, clientY: number): boolean {
  if (!mask) return true
  const x = Math.floor(clientX / (Math.max(1, window.innerWidth) / maskW))
  const y = Math.floor(clientY / (Math.max(1, window.innerHeight) / maskH))
  if (x < 0 || y < 0 || x >= maskW || y >= maskH) return false
  return mask[y * maskW + x] > SHARP_ALPHA
}

/** Load the skin's plate, cache its alpha, and reshape the OS window.
 *  `attempt` guards the resample loop below against a window that keeps
 *  changing size while the mask is sampled. */
export async function applySkinShape(url?: string, attempt = 0): Promise<void> {
  source = url ?? null
  if (!url || typeof window.skinwalker?.setWindowShape !== 'function') {
    mask = null
    send([])
    return
  }

  const img = new Image()
  img.src = url
  // decode() can stall on an offscreen image, so wait for load with a bounded
  // fallback instead of blocking the shape forever.
  await new Promise<void>((resolve) => {
    if (img.complete) return resolve()
    const done = (): void => resolve()
    img.addEventListener('load', done, { once: true })
    img.addEventListener('error', done, { once: true })
    window.setTimeout(done, 1500)
  })
  if (!img.naturalWidth) {
    mask = null
    send([])
    return
  }

  const viewW = Math.max(1, window.innerWidth)
  const viewH = Math.max(1, window.innerHeight)
  const w = Math.max(1, Math.ceil(viewW / SCALE))
  const h = Math.max(1, Math.ceil(viewH / SCALE))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return

  // Painted body.
  ctx.drawImage(img, 0, 0, w, h)
  const sharp = ctx.getImageData(0, 0, w, h).data

  // The aura around it — a blurred copy — so the shape does not slice the
  // glow off at the silhouette and leave a hard edge.
  ctx.clearRect(0, 0, w, h)
  ctx.filter = 'blur(8px)'
  ctx.drawImage(img, 0, 0, w, h)
  ctx.filter = 'none'
  const glow = ctx.getImageData(0, 0, w, h).data

  const on = new Uint8Array(w * h)
  const body = new Uint8Array(w * h)
  let wide = 0
  for (let i = 0; i < w * h; i++) {
    const a = sharp[i * 4 + 3]
    body[i] = a
    if (a > SHARP_ALPHA || glow[i * 4 + 3] > GLOW_ALPHA) {
      on[i] = 1
      wide++
    }
  }

  // An empty mask or one covering nearly everything is not a silhouette —
  // keep the plain rectangular window rather than risk clipping the app.
  if (wide === 0 || wide > w * h * 0.95) {
    mask = null
    send([])
    return
  }

  // Entering mini mode resizes and reshapes together, so the viewport can
  // change while this mask is being sampled. Rects built for the old size
  // are clipped by the OS against the new window, which cuts whole bands
  // (the wide wing rows) out of the silhouette — resample for the new size.
  if (attempt < 2 && (Math.abs(window.innerWidth - viewW) > 1 || Math.abs(window.innerHeight - viewH) > 1)) {
    return applySkinShape(url, attempt + 1)
  }

  maskW = w
  maskH = h
  mask = body
  send(buildRects(on, w, h), { width: viewW, height: viewH })
}

/** One rect per scanline, merged vertically where the runs line up. */
function buildRects(on: Uint8Array, w: number, h: number): Rect[] {
  const out: Rect[] = []
  let active = new Map<string, Rect>()

  for (let y = 0; y < h; y++) {
    const next = new Map<string, Rect>()
    let x = 0
    while (x < w) {
      if (!on[y * w + x]) {
        x++
        continue
      }
      const start = x
      while (x < w && on[y * w + x]) x++
      const width = x - start
      const key = `${start}:${width}`
      const prev = active.get(key)
      if (prev && prev.y + prev.height === y * SCALE) {
        prev.height += SCALE
        next.set(key, prev)
      } else {
        const rect = { x: start * SCALE, y: y * SCALE, width: width * SCALE, height: SCALE }
        out.push(rect)
        next.set(key, rect)
      }
    }
    active = next
  }
  return out
}

/** Re-shape after a resize (a skin may set the window size on mount). */
export function installShapeResize(): void {
  window.addEventListener('resize', () => {
    if (!source) return
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => void applySkinShape(source ?? undefined), 150)
  })
}
