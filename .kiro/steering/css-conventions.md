---
inclusion: auto
name: css-conventions
description: CSS coding standards and naming conventions for Skinwalker skins
---

# CSS Conventions for Skinwalker

## Skin-Scoped Styling

Every skin gets its own scoped block in `src/renderer/style.css`:

```css
.dracula-skin .dr-element { /* Dracula skin styles */ }
.frankenstein-skin .fr-element { /* Frankenstein skin styles */ }
.skeleton-skin .sk-element { /* Skeleton skin styles */ }
```

## Naming Conventions

### Skin Prefixes
- **Dracula:** `.dr-*` (e.g., `.dr-medallion`, `.dr-blood`, `.dr-cape`)
- **Frankenstein:** `.fr-*` (e.g., `.fr-dial`, `.fr-bolts`, `.fr-scar`)
- **Skeleton:** `.sk-*` (e.g., `.sk-jaw`, `.sk-spine`, `.sk-ribs`)

### Element Types
- **Controls:** `.{prefix}-[control-name]` (e.g., `.dr-medallion`, `.fr-dial`)
- **Regions:** `.{prefix}-[region-name]` (e.g., `.dr-cape`, `.sk-jaw`)
- **States:** `.{prefix}-[element]--[state]` (e.g., `.dr-medallion--playing`)
- **Animations:** `{prefix}-[name]` (e.g., `@keyframes dr-drip`)

### Reserved Class Names
- `.skin` — root wrapper for all skins
- `.{skinname}-skin` — skin identifier (e.g., `.dracula-skin`)

## Layout Patterns

### Fixed Positioning (Character Frames)
```css
.dracula-skin .dr-frame {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  object-fit: contain;
  pointer-events: none;
}
```

### Container Query Units (Scalable UI)
Use `cqw` (container query width) for elements that should scale with window:

```css
.dracula-skin {
  container-type: inline-size;
}

.dracula-skin .dr-title {
  left: 27cqw;
  top: 43.5cqw;
  width: 46cqw;
  height: 5.5cqw;
}
```

### Absolute Positioning (Anatomy Controls)
Position using percentages from reference artwork:

```css
.dracula-skin .dr-medallion {
  position: absolute;
  left: 44%;
  top: 34.1%;
  width: 12%;
  height: 7%;
}
```

## Animation Guidelines

### Performance
- **Always use GPU-accelerated properties:** `transform`, `opacity`, `filter`
- **Avoid animating:** `width`, `height`, `top`, `left`, `margin`, `padding`
- **Use `will-change` sparingly** — only on elements that animate frequently

### Randomization
Prevent animation sync with randomized delays:

```css
.dr-drip:nth-child(1) { animation-delay: -0.3s; }
.dr-drip:nth-child(2) { animation-delay: -0.8s; }
.dr-drip:nth-child(3) { animation-delay: -1.2s; }
/* Or use inline styles with Math.random() in JS */
```

### Naming
```css
@keyframes {prefix}-{action} {
  /* e.g., dr-drip, fr-pulse, sk-glow */
}
```

## Color Standards

### Dracula Palette
```css
--dr-blood-dark: #7c121d;
--dr-blood-bright: #dc3c3b;
--dr-blood-orange: #e04846;
--dr-crimson: #a01f26;
--dr-highlight: #ff5050;
--dr-gold: #f4ca7e;
```

### Opacity Levels
- **Solid elements:** `opacity: 1` or `opacity: 0.92-0.98`
- **Glows/highlights:** `opacity: 0.6-0.85`
- **Subtle effects:** `opacity: 0.3-0.5`
- **Very subtle:** `opacity: 0.1-0.25`

## Filter Effects

### Drop Shadows
```css
/* Subtle depth */
filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));

/* Moderate glow */
filter: drop-shadow(0 0 4px rgba(255, 80, 80, 0.5));

/* Strong effect */
filter: drop-shadow(0 0 8px rgba(255, 80, 80, 0.8));
```

### Avoid Filter on Wrappers
**DON'T:**
```css
.dr-wrapper {
  filter: drop-shadow(...); /* Makes wrapper the containing block */
}
.dr-child {
  position: absolute; /* Now resolves against wrapper, not viewport */
}
```

**DO:**
```css
.dr-wrapper {
  filter: none;
}
.dr-child {
  position: absolute;
  filter: drop-shadow(...); /* Apply to element itself */
}
```

## Z-Index Layers

Standard z-index hierarchy:

```css
/* Layer 0: Background */
.dr-frame { z-index: 0; }

/* Layer 1: Behind-character effects */
.dr-aura { z-index: 1; }

/* Layer 2: Character base */
.dr-body { z-index: 2; }

/* Layer 3: Interactive elements */
.dr-seek, .dr-blood { z-index: 3; }

/* Layer 4: Overlay controls */
.dr-medallion { z-index: 4; }

/* Layer 5: Top UI elements */
.dr-title, .dr-playlist { z-index: 5; }

/* Layer 10: Window controls */
.window-controls { z-index: 10; }
```

## Pointer Events

### Decorative Elements
```css
.dr-blood, .dr-drip, .dr-splatter {
  pointer-events: none; /* Don't block clicks */
}
```

### Interactive Elements
```css
.dr-medallion, .dr-seek {
  pointer-events: auto; /* Accept clicks */
  cursor: pointer;
}
```

### Drag Regions
```css
.dr-frame {
  -webkit-app-region: drag; /* Window draggable */
}
.dr-medallion {
  -webkit-app-region: no-drag; /* But controls are not */
}
```

## Responsive Scaling

### Container Queries (Preferred)
```css
.dracula-skin {
  container-type: inline-size;
}

.dr-title {
  font-size: 2.5cqw; /* Scales with window */
}
```

### Viewport Units (Fallback)
```css
.dr-title {
  font-size: clamp(10px, 2.5vw, 24px);
}
```

## Common Patterns

### Centered Absolute Element
```css
.dr-element {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
```

### Full-Bleed Background
```css
.dr-background {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
}
```

### Glowing Button
```css
.dr-button {
  background: radial-gradient(circle, #ff8b88, #d83c3b);
  box-shadow: 
    0 0 4px rgba(255, 71, 82, 0.5),
    inset -1px -1px 2px rgba(0, 0, 0, 0.3);
  transition: box-shadow 0.2s ease;
}

.dr-button:hover {
  box-shadow: 
    0 0 8px rgba(255, 71, 82, 0.8),
    inset -1px -1px 2px rgba(0, 0, 0, 0.3);
}
```

## Performance Budgets

- **Total CSS file size:** < 50KB
- **Max selectors per skin:** < 200
- **Max animation keyframes:** < 30 per skin
- **Filter effects per element:** < 3

## Cleanup Rules

### When Replacing Skins
1. Delete ALL old CSS blocks for that skin
2. Don't leave overrides — remove source
3. Search for old class names: `.dr-old-class`
4. Verify no orphaned animations: `@keyframes dr-old-*`

### Before Committing
1. Remove commented-out blocks
2. Remove unused animations
3. Consolidate duplicate declarations
4. Run through CSS validator
