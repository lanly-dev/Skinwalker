/**
 * Remembers which skin was active, so the app reopens on it.
 * Storage errors are ignored: the caller falls back to the first skin.
 */
const KEY = 'skinwalker.lastSkin'

export function loadLastSkinId(): string | null {
  try {
    return window.localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function saveLastSkinId(id: string): void {
  try {
    window.localStorage.setItem(KEY, id)
  } catch {
    // Storage unavailable or full; the next launch uses the default skin.
  }
}
