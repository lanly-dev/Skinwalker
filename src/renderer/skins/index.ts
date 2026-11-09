/**
 * Skin registry — add new skins here.
 * The switcher UI reads this array to populate the monster selector.
 */
import type { Skin } from './Skin'
import { WerewolfSkin } from './WerewolfSkin'
// import { DraculaSkin }  from './DraculaSkin'   // TODO
// import { SwampThingSkin } from './SwampThingSkin' // TODO

export const SKINS: readonly Skin[] = [
  new WerewolfSkin(),
  // new DraculaSkin(),
  // new SwampThingSkin(),
]
