/**
 * Track durations and time formatting shared by every skin.
 *
 * Durations are probed once per URL for the whole app (metadata only), so a
 * skin swap reuses what an earlier skin already learned.
 */
const durations = new Map<string, number>()
/** URLs found unreadable; one is not probed again while it stays on the
 *  playlist. Like `durations`, this is forgotten when its folder goes away. */
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

// Arriving durations are applied in one repaint per 200 ms, not one per track.
// Only the active skin probes, so the latest callback is the one.
let onUpdate: (() => void) | null = null
let flushTimer = 0
function scheduleUpdate(): void {
  if (flushTimer) return
  flushTimer = window.setTimeout(() => {
    flushTimer = 0
    onUpdate?.()
  }, 200)
}

// A folder can hold hundreds of tracks. Starting one <audio> per track at once
// opens that many file handles and media pipelines, and the renderer stalls
// while Chromium services them; a few at a time reads just as fast and keeps
// the window responsive.
const MAX_CONCURRENT_PROBES = 4
/** A probe that never reports anything (odd container, unreadable disk) must
 *  not hold its slot forever and starve the queue. */
const PROBE_TIMEOUT_MS = 15000
/** URLs waiting for a probe, in the order they were queued. Together with
 *  `running` this is every URL already being handled, so no separate in-flight
 *  mark can be left behind. */
const pending = new Set<string>()
/** Drops a probe that has already started, keyed by URL. */
const running = new Map<string, () => void>()
let active = 0

function enqueue(url: string): void {
  if (durations.has(url) || failed.has(url) || pending.has(url) || running.has(url)) return
  pending.add(url)
  pump()
}

function pump(): void {
  while (active < MAX_CONCURRENT_PROBES && pending.size > 0) {
    const url = pending.values().next().value as string
    pending.delete(url)
    active++
    probeOne(url)
  }
}

/** Forget every track that left the playlist: its cached duration and failure
 *  would otherwise pile up across a session's folders, a queued probe would be
 *  read before the new folder's tracks, and a started one would keep a slot on
 *  the old folder. What is still on the playlist is kept, so re-opening the
 *  same folder shows its times at once. */
function retain(urls: ReadonlySet<string>): void {
  for (const url of durations.keys()) if (!urls.has(url)) durations.delete(url)
  for (const url of failed) if (!urls.has(url)) failed.delete(url)
  for (const url of pending) if (!urls.has(url)) pending.delete(url)
  for (const [url, abort] of [...running]) if (!urls.has(url)) abort()
}

/** Read one track's duration with a throwaway <audio>. */
function probeOne(url: string): void {
  const probe = new Audio()
  probe.preload = 'metadata'
  let settled = false

  /** Frees the slot exactly once; false if this probe already finished. */
  function release(): boolean {
    if (settled) return false
    settled = true
    window.clearTimeout(timer)
    running.delete(url)
    active--
    probe.removeAttribute('src')
    probe.load()
    return true
  }

  function done(): void {
    if (!release()) return
    if (durations.has(url)) scheduleUpdate()
    else failed.add(url)
    pump()
  }

  const timer = window.setTimeout(done, PROBE_TIMEOUT_MS)
  // Dropped from the playlist mid-probe: stop reading, without calling the
  // track unreadable.
  running.set(url, () => {
    if (release()) pump()
  })

  probe.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(probe.duration) && probe.duration > 0) durations.set(url, probe.duration)
    done()
  }, { once: true })
  probe.addEventListener('error', done, { once: true })
  // A page served over http (dev) may not load file:// media; the main
  // process serves Open-folder files through this scheme instead.
  probe.src = url.startsWith('file:') ? `skinwalker-media:?u=${encodeURIComponent(url)}` : url
}

/**
 * Probe the duration of each track not yet known; `update` repaints the
 * caller's playlist when new durations arrive.
 */
export function probeDurations(tracks: ReadonlyArray<{ url: string }>, update: () => void): void {
  onUpdate = update
  retain(new Set(tracks.map(({ url }) => url)))
  for (const { url } of tracks) enqueue(url)
}
