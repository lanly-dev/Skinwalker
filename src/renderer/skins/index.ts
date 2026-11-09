/**
 * Skin registry — the switcher UI reads this array in order.
 * First entry is the default skin shown on launch.
 * Add new skins here.
 */
import type { Skin } from './Skin'
import { DraculaSkin }      from './DraculaSkin'
import { FrankensteinSkin } from './FrankensteinSkin'
import { SkeletonSkin }     from './SkeletonSkin'
import { SkeletonTrioSkin } from './SkeletonTrioSkin'

export const SKINS: readonly Skin[] = [
  new DraculaSkin(),       // flagship — polish this hardest
  new FrankensteinSkin(),
  new SkeletonSkin(),
  new SkeletonTrioSkin(),
]
