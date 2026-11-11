---
inclusion: manual
---

# Spec Template for Skinwalker Features

Use this template when creating new specs in `.kiro/specs/`. Every feature MUST have a spec before implementation.

## Basic Structure

```markdown
# [Feature Name] Specification

**Status:** Draft | In Progress | Complete  
**Created:** YYYY-MM-DD  
**Owner:** [Who requested/designed this]  
**Implementation:** [Agent/person who will build it]

## Overview
[2-3 sentences describing what this feature is and why it exists]

## Requirements

### Functional Requirements
- [ ] Requirement 1 — specific, testable behavior
- [ ] Requirement 2 — what the user can do
- [ ] Requirement 3 — what the system must handle

### Technical Requirements
- [ ] Must integrate with [existing system]
- [ ] Must use [technology/API]
- [ ] Must preserve [constraint]

### Non-Functional Requirements
- [ ] Performance: [metric]
- [ ] Compatibility: [platform/browser/version]
- [ ] Accessibility: [standard]

## Design Approach

### Architecture
[How this fits into the existing system]

### Key Components
1. **Component A** — `path/to/file.ts`
   - Purpose: [what it does]
   - Interfaces: [what it exposes]
   
2. **Component B** — `path/to/file.ts`
   - Purpose: [what it does]
   - Dependencies: [what it needs]

### Data Flow
[How data moves through the system, from input to output]

### UI/UX Notes
[If applicable: layout, interactions, animations]

## Implementation Tasks

### Phase 1: Foundation
- [ ] Task 1 — [specific work item]
- [ ] Task 2 — [specific work item]

### Phase 2: Core Feature
- [ ] Task 3 — [specific work item]
- [ ] Task 4 — [specific work item]

### Phase 3: Polish & Integration
- [ ] Task 5 — [specific work item]
- [ ] Task 6 — [specific work item]

## Acceptance Criteria

Must ALL pass before marking complete:
- [ ] Criterion 1 — how to verify
- [ ] Criterion 2 — expected behavior
- [ ] Criterion 3 — edge cases handled
- [ ] TypeScript compiles with zero errors
- [ ] No console errors in dev or production build
- [ ] Tested on target platform

## Open Questions
- [ ] Question 1 — needs decision from [person]
- [ ] Question 2 — needs research/prototype

## Risks & Mitigations
- **Risk:** [what could go wrong]
  - **Mitigation:** [how to prevent/handle]

## References
- Link to AGENTS.md decision: [section]
- Related specs: [file names]
- External docs: [URLs]

---

## Implementation Notes (Fill During/After Build)

### What Changed
[Differences from original design, with reasons]

### Lessons Learned
[Problems encountered, solutions found — add to AGENTS.md]

### Future Work
[Deferred items, tech debt, improvements]
```

## Example: Blood Effects Spec

```markdown
# Dracula Blood Effects Specification

**Status:** Complete  
**Created:** 2026-11-10  
**Owner:** User request (seekbar blood enhancement)  
**Implementation:** Kiro

## Overview
Add extensive dripping blood effects to the Dracula skin's seekbar to make it look like a living, bleeding wound. Effects must animate independently for an organic appearance.

## Requirements

### Functional Requirements
- [ ] 21 main blood drips at exact boba.page positions
- [ ] 40+ additional small drips scattered randomly
- [ ] 30+ blood splatter particles above seekbar
- [ ] 10+ long blood trails (vertical streaks)
- [ ] Pulsing blood pool beneath seekbar
- [ ] All effects animate continuously
- [ ] No animation syncing (randomized delays)

### Technical Requirements
- [ ] Must use CSS animations (GPU-accelerated, no JS loops)
- [ ] Must not block pointer events (seekbar still clickable)
- [ ] Must work with existing `.dr-blood` container
- [ ] Must scale with window size (cqw units)

### Non-Functional Requirements
- [ ] Performance: 60fps on target hardware
- [ ] Visual: Matte/realistic blood, not glowing/neon
- [ ] Accessibility: Purely decorative (aria-hidden="true")

## Design Approach

### Architecture
Build blood elements procedurally in `DraculaSkin.buildDrips()`:
- Generate DOM elements with CSS custom properties
- Randomize positions, sizes, speeds, delays
- Layer effects: drips → trails → splatter → pool

### Key Components
1. **DraculaSkin.ts** — `buildDrips()` method
   - Creates 101+ animated spans
   - Sets CSS variables per element
   
2. **style.css** — `.dr-drip`, `.dr-drip-small`, `.dr-splatter`, `.dr-blood-trail`
   - CSS animations and gradients
   - Drop shadows and filters

### Data Flow
Mount skin → buildDrips() → create elements → append to `.dr-blood` → CSS animates

## Implementation Tasks

### Phase 1: Main Drips
- [x] Keep 21 original drips from boba.page
- [x] Enhance with vertical gradient
- [x] Add drop shadows

### Phase 2: Additional Blood
- [x] Add 40 small drips
- [x] Add 30 splatter particles
- [x] Add 10 blood trails
- [x] Add pulsing blood pool (::before/::after)

### Phase 3: Polish
- [x] Randomize all delays (no sync)
- [x] Tune colors (darker, more matte)
- [x] Reduce glow effects per user request
- [x] Test performance

## Acceptance Criteria

- [x] 101+ animated blood elements visible
- [x] Each animates on different cycle (organic appearance)
- [x] Seekbar remains fully interactive
- [x] Runs at 60fps in dev and production
- [x] TypeScript compiles clean
- [x] Glow reduced to user satisfaction

## Implementation Notes

### What Changed
- Added SVG blood edge effect (user request) after initial completion
- Reduced all glow effects by 40-60% in second iteration
- All blur radii cut in half

### Lessons Learned
- CSS custom properties are perfect for procedural generation
- Randomized delays prevent sync issues
- Filters on wrappers can cause layout problems
- Always test glow on dark backgrounds (too bright on black)
```

## When to Create a Spec

### Always Required
- New skins or skin features
- New player controls or audio features
- IPC bridge additions
- Build/package changes
- Window management changes

### Optional (But Recommended)
- Bug fixes that need design decisions
- Refactoring that touches multiple files
- Performance optimizations with tradeoffs

### Not Needed
- Typo fixes in comments
- Formatting/linting changes
- Documentation updates
- Asset replacements (same interface)
