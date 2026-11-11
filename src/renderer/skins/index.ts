/**
 * Skin registry — the first entry is the skin shown on launch.
 * Add new skins here.
 */
import type { Skin } from './Skin'
import { DraculaSkin }      from './DraculaSkin'
import { FrankensteinSkin } from './FrankensteinSkin'

export const SKINS: readonly Skin[] = [
  new DraculaSkin(),       // flagship — polish this hardest
  new FrankensteinSkin(),
]
