/**
 * Track durations and time formatting shared by every skin.
 *
 * Durations are probed once per URL for the whole app (metadata only), so a
 * skin swap reuses what an earlier skin already learned.
 */
const durations = new Map<string, number>()
/** URLs being probed or known to be unreadable; neither is probed again. */
const inFlight = new Set<string>()
const failed = new Set<string>()

/** `mm:ss`, or `--:--` when the value is not a finite number. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '--:--'
  const s = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** Formatted duration of a track, or `--:--` until it is known. */
export function durationLabel(url: string): string {
  const seconds = durations.get(url)
  return seconds ? formatTime(seconds) : '--:--'
}

// Arriving durations are applied in one playlist rebuild per 200 ms, not one
// per track. Only the active skin probes, so the latest callback is the one.
let onUpdate: (() => void) | null = null
let flushTimer = 0
function scheduleUpdate(): void {
  if (flushTimer) return
  flushTimer = window.setTimeout(() => {
    flushTimer = 0
    onUpdate?.()
  }, 200)
}

/**
 * Probe the duration of each track not yet known; `update` re-renders the
 * caller's playlist when new durations arrive.
 */
export function probeDurations(tracks: ReadonlyArray<{ url: string }>, update: () => void): void {
  onUpdate = update
  for (const { url } of tracks) {
    if (durations.has(url) || failed.has(url) || inFlight.has(url)) continue
    inFlight.add(url)
    const probe = new Audio()
    probe.preload = 'metadata'
    const done = (): void => {
      inFlight.delete(url)
      probe.removeAttribute('src')
      probe.load()
      if (durations.has(url)) scheduleUpdate()
      else failed.add(url)
    }
    probe.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(probe.duration) && probe.duration > 0) durations.set(url, probe.duration)
      done()
    }, { once: true })
    probe.addEventListener('error', done, { once: true })
    // A page served over http (dev) may not load file:// media; the main
    // process serves Open-folder files through this scheme instead.
    probe.src = url.startsWith('file:') ? `skinwalker-media:?u=${encodeURIComponent(url)}` : url
  }
}