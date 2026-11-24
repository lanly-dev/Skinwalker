/**
 * Track durations and time formatting shared by every skin.
 *
 * Durations are probed once per URL for the whole app (metadata only), so a
 * skin swap reuses what an earlier skin already learned.
 */
const durations = new Map<string, number>()
/** URLs being probed, with the callbacks waiting for each one. */
const waiting = new Map<string, Array<() => void>>()
/** URLs whose metadata could not be read; not probed again. */
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

/**
 * Probe the duration of each track not yet known. `onUpdate` runs once for
 * each track whose duration arrives (callers re-render their playlist).
 */
export function probeDurations(tracks: ReadonlyArray<{ url: string }>, onUpdate: () => void): void {
  for (const { url } of tracks) {
    if (durations.has(url) || failed.has(url)) continue
    const queue = waiting.get(url)
    if (queue) {
      queue.push(onUpdate)
      continue
    }
    waiting.set(url, [onUpdate])
    const probe = new Audio()
    probe.preload = 'metadata'
    const done = (): void => {
      probe.src = ''
      const callbacks = waiting.get(url) ?? []
      waiting.delete(url)
      if (durations.has(url)) callbacks.forEach((cb) => cb())
      else failed.add(url)
    }
    probe.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(probe.duration) && probe.duration > 0) durations.set(url, probe.duration)
      done()
    }, { once: true })
    probe.addEventListener('error', done, { once: true })
    probe.src = url
  }
}
