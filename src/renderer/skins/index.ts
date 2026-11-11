/**
 * Skin registry — the first entry is the skin shown on launch.
 * Add new skins here.
 */
import type { Skin } from './Skin'
import { DraculaSkin }      from './DraculaSkin'
import { FrankensteinSkin } from './FrankensteinSkin'
import { SkeletonSkin }     from './SkeletonSkin'

export const SKINS: readonly Skin[] = [
  new SkeletonSkin(),      // launch skin — the web build's neon plate
  new DraculaSkin(),       // flagship — polish this hardest
  new FrankensteinSkin(),
]
