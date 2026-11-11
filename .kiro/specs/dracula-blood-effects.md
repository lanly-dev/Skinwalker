# Dracula Seekbar Blood Effects Specification

**Status:** Complete  
**Created:** 2026-11-10  
**Owner:** User request (seekbar blood enhancement + dripping edge)  
**Implementation:** Kiro

## Overview
Add extensive dripping blood effects to the Dracula skin's seekbar to make it look like a living, bleeding wound with a melting edge effect. Effects must animate independently for an organic, chaotic appearance while maintaining performance.

## Requirements

### Functional Requirements
- [x] 21 main blood drips at exact boba.page positions
- [x] 40 additional small drips scattered randomly
- [x] 30 blood splatter particles above seekbar
- [x] 10 long blood trails (vertical streaks)
- [x] Pulsing blood pool beneath seekbar with flowing effect
- [x] SVG dripping edge along top of seekbar (wavy path with hanging drips)
- [x] All effects animate continuously
- [x] No animation syncing (randomized delays)
- [x] Glow effects reduced for matte/realistic appearance

### Technical Requirements
- [x] Must use CSS animations (GPU-accelerated, no JS loops)
- [x] Must not block pointer events (seekbar still clickable)
- [x] Must work with existing `.dr-blood` container
- [x] Must scale with window size (percentage positioning)
- [x] SVG scales responsively with seekbar width

### Non-Functional Requirements
- [x] Performance: 60fps on target hardware
- [x] Visual: Matte/realistic blood, not glowing/neon
- [x] Accessibility: Purely decorative (aria-hidden="true")

## Design Approach

### Architecture
Build blood elements procedurally in `DraculaSkin.buildDrips()`:
- Generate DOM elements with CSS custom properties
- Randomize positions, sizes, speeds, delays
- Layer effects: pool → drips → trails → splatter → SVG edge

### Key Components
1. **DraculaSkin.ts** — `buildDrips()` method
   - Creates 101+ animated spans in `.dr-blood`
   - Sets CSS variables per element: `--x`, `--w`, `--h`, `--speed`, `--delay`
   - Adds inline SVG for dripping edge effect
   
2. **style.css** — Blood effect styles
   - `.dr-blood` — container with pulsing pool (::before/::after)
   - `.dr-drip` — main blood drops
   - `.dr-drip-small` — additional smaller drops
   - `.dr-splatter` — floating particles
   - `.dr-blood-trail` — long streaks
   - `.dr-blood-edge` — SVG dripping edge
   - Animations: `dr-drip`, `dr-bead`, `dr-fall`, `dr-splatter-float`, `dr-trail-drip`, `dr-edge-drop`, `dr-edge-drip`

### Data Flow
Mount skin → buildDrips() → create 101+ elements + SVG → append to `.dr-blood` → CSS animates

## Implementation Tasks

### Phase 1: Main Drips (Complete)
- [x] Keep 21 original drips from boba.page
- [x] Enhance with vertical gradient (180deg)
- [x] Add drop shadows with reduced glow
- [x] Add internal highlights (::before)

### Phase 2: Additional Blood (Complete)
- [x] Add 40 small drips (random positions)
- [x] Add 30 splatter particles (floating above)
- [x] Add 10 blood trails (long vertical streaks)
- [x] Add pulsing blood pool (::before pulsing, ::after flowing)

### Phase 3: SVG Dripping Edge (Complete)
- [x] Create inline SVG with wavy path along top of seekbar
- [x] Add 9 animated blood drops (circles with pulse)
- [x] Add 5 hanging drip shapes (ellipses with stretch animation)
- [x] Stagger animation delays for organic effect

### Phase 4: Glow Reduction (Complete)
- [x] Reduce blur radii by 50% (4px→2px, 3px→1px, 2px→1px)
- [x] Reduce opacity/brightness by 40% average
- [x] Reduce thumb pulse intensity by 60%
- [x] Darker, more matte colors

## Acceptance Criteria

- [x] 101+ animated blood elements visible (21 main + 40 small + 30 splatter + 10 trails)
- [x] SVG dripping edge with 14 animated elements
- [x] Each animates on different cycle (organic appearance)
- [x] Seekbar remains fully interactive (no pointer blocking)
- [x] Runs at 60fps in dev and production
- [x] TypeScript compiles clean
- [x] Glow effects reduced to matte/realistic appearance
- [x] Blood looks darker, less neon

## Implementation Notes

### What Changed from Original Design

1. **SVG Edge Addition:** User requested seekbar effect like reference image showing dripping edge. Added inline SVG with:
   - Wavy path for melting blood edge
   - 9 circular drops that pulse
   - 5 elliptical hanging drips that stretch
   - All positioned at top of seekbar

2. **Glow Reduction Pass:** Initial implementation was too bright/glowing. Second iteration reduced:
   - All blur radii cut in half
   - All opacity values reduced ~40%
   - Thumb pulse reduced 60%
   - Changed to darker color palette

3. **Procedural Generation:** Initially considered static HTML, but procedural generation in `buildDrips()` allows:
   - Randomized positioning for organic appearance
   - No animation syncing (all delays unique)
   - Easier to adjust quantities

### Blood Element Breakdown
- **21 main drips** — Original boba.page positions (4%, 8%, 12%, ...)
- **40 small drips** — `Math.random() * 100%` positioning
- **30 splatter particles** — Above seekbar at `-5px to -15px`
- **10 blood trails** — Positioned at `8 + i * 9 + random(6)%`
- **SVG edge:**
  - 1 wavy path
  - 9 circle drops at 8%, 18%, 28%, 38%, 48%, 58%, 68%, 78%, 88%
  - 5 ellipse drips at 15%, 35%, 55%, 75%, 92%

### Performance Characteristics
- All CSS animations (GPU-accelerated)
- No JavaScript animation loops
- Elements have `pointer-events: none` (no click blocking)
- Tested at 60fps with visualizer active

### Lessons Learned

1. **Glow on Dark Backgrounds:** Blood effects that look good on light backgrounds can appear too bright/neon on dark backgrounds. Test all effects on the actual dark Dracula background.

2. **Procedural + CSS Variables:** Using CSS custom properties (`--x`, `--size`, `--delay`) with procedural generation creates infinite variety from finite CSS.

3. **Animation Staggering:** Even with randomized delays, large numbers of similar elements can appear synchronized. Ensure delay ranges are wider than animation durations.

4. **SVG Scaling:** Inline SVG with `viewBox` and `preserveAspectRatio="none"` scales perfectly with parent container width changes.

5. **Filter Performance:** Multiple `filter: drop-shadow()` calls are expensive. Limit to 1-2 per element maximum. Prefer single combined shadows over multiple layers.

### Future Work

- [ ] Optional: User preference for blood density (light/medium/heavy)
- [ ] Optional: Blood color themes (red/black/green for different moods)
- [ ] Optional: React to volume level (more blood = louder music)
- [ ] Optional: Track-specific blood patterns (different demos = different drip patterns)

## Color Palette Used

```css
/* Blood Colors */
--blood-dark: #7c121d;
--blood-bright: #dc3c3b;
--blood-orange: #e04846;
--blood-crimson: #a01f26;
--blood-deep: #b82833;
--blood-highlight: #ff5050;

/* Edge SVG */
--edge-main: #c83640;
--edge-drops: #d83c3b;
--edge-drips: #b82833;
```

## Animation Timings

| Effect | Duration | Delay Range | Easing |
|--------|----------|-------------|---------|
| Main drips | 1.7-2.9s | -0.3s spread | ease-in-out |
| Small drips | 1.2-2.8s | -0s to -3s | ease-in-out |
| Splatter float | 2-5s | -0s to -5s | ease-in-out |
| Blood trails | 3-5s | -0s to -5s | ease-in-out |
| Blood pool pulse | 3s | 0s | ease-in-out |
| Blood flow | 4s | 0s | linear |
| Thumb pulse | 2s | 0s | ease-in-out |
| Edge drops | 3s | Staggered -0.5s intervals | ease-in-out |
| Edge drips | 4s | Staggered -0.8s intervals | ease-in-out |

## References
- AGENTS.md: Dracula blood line mechanics decision (2026-11-10)
- boba.page reference: Original blood drip positions
- User reference image: SVG dripping edge inspiration
- CSS conventions: `.kiro/steering/css-conventions.md`
