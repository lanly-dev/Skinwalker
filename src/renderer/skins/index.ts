/**
 * Skin registry — the first entry is the skin shown on launch.
 * Add new skins here.
 */
import type { Skin } from './Skin'
import { DraculaSkin }      from './DraculaSkin'
import { FrankensteinSkin } from './FrankensteinSkin'
import { SkeletonSkin }     from './SkeletonSkin'

export const SKINS: readonly Skin[] = [
  new DraculaSkin(),       // launch skin — flagship, on the updated web plate
  new SkeletonSkin(),      // the web build's neon plate
  new FrankensteinSkin(),
]
