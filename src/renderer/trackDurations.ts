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
    if (url.startsWith('file:')) enqueueLocal(url)
    else probeSrc(url, url, () => finish(url))
  }
}

/** Point a metadata-only Audio element at `src` and record the duration
 *  under `url`; `after` runs once, on success or error. */
function probeSrc(url: string, src: string, after: () => void): void {
  const probe = new Audio()
  probe.preload = 'metadata'
  const done = (): void => {
    probe.removeAttribute('src')
    probe.load()
    after()
  }
  probe.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(probe.duration) && probe.duration > 0) durations.set(url, probe.duration)
    done()
  }, { once: true })
  probe.addEventListener('error', done, { once: true })
  probe.src = src
}

/** Run the callbacks waiting on `url`, or remember it as failed. */
function finish(url: string): void {
  const callbacks = waiting.get(url) ?? []
  waiting.delete(url)
  if (durations.has(url)) callbacks.forEach((cb) => cb())
  else failed.add(url)
}

// A page served over http (dev) may not load file:// media, so local tracks
// are read through the audio:read IPC and probed as Blob URLs. Two at a time,
// so opening a large folder does not read every file at once.
const LOCAL_SLOTS = 2
const localQueue: string[] = []
let localBusy = 0

function enqueueLocal(url: string): void {
  localQueue.push(url)
  pumpLocal()
}

function pumpLocal(): void {
  while (localBusy < LOCAL_SLOTS && localQueue.length) {
    const url = localQueue.shift()!
    localBusy++
    void probeLocal(url).finally(() => {
      localBusy--
      pumpLocal()
    })
  }
}

async function probeLocal(url: string): Promise<void> {
  const bytes = await window.skinwalker?.readAudioFile?.(url).catch(() => null)
  if (!bytes) {
    finish(url)
    return
  }
  const blobUrl = URL.createObjectURL(new Blob([bytes]))
  await new Promise<void>((resolve) => probeSrc(url, blobUrl, resolve))
  URL.revokeObjectURL(blobUrl)
  finish(url)
}
