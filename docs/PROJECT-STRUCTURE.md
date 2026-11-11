# Skinwalker Project Structure

Complete overview of the project file organization.

## Root Directory

```
skinwalker/
├── .git/                   # Git repository
├── .kiro/                  # Kiro AI workflows, specs, steering (see below)
├── .vite/                  # Vite cache (gitignored)
├── docs/                   # Project documentation
├── node_modules/           # NPM dependencies (gitignored)
├── out/                    # Build output (gitignored)
├── public/                 # Static assets bundled with app
├── reference/              # Design references (gitignored except README)
├── resources/              # Native app resources (icons)
├── scripts/                # Build and utility scripts
├── src/                    # Source code (see below)
├── .gitignore              # Git ignore rules
├── electron.vite.config.ts # Vite configuration for Electron
├── LICENSE                 # MIT License
├── package.json            # NPM package definition
├── package-lock.json       # NPM lock file (gitignored)
├── README.md               # Project overview
├── tsconfig.json           # TypeScript config (base)
├── tsconfig.node.json      # TypeScript config (Node/main process)
└── tsconfig.web.json       # TypeScript config (renderer process)
```

## Source Code (`src/`)

### Main Process (`src/main/`)
Electron main process — Node.js environment

```
src/main/
└── index.ts                # Main entry: window creation, IPC handlers
```

**Responsibilities:**
- Create and manage BrowserWindow
- Handle IPC requests from renderer
- File system operations
- Native OS integration (window shaping, dialogs)

### Preload (`src/preload/`)
IPC bridge between main and renderer

```
src/preload/
├── index.ts                # contextBridge API exposure
└── index.d.ts              # TypeScript definitions for window.skinwalker
```

**Responsibilities:**
- Expose secure IPC API to renderer via `contextBridge`
- Type-safe bridge (`window.skinwalker`)
- Security boundary (context isolation)

### Renderer (`src/renderer/`)
UI and application logic — Chromium environment

```
src/renderer/
├── assets/                 # Images, fonts, static files
│   ├── dracula-frame.webp
│   ├── dracula-bat.webp
│   ├── dracula-tools.jpg
│   ├── frankenstein-frame.webp
│   ├── frankenstein-eye-left.png
│   ├── frankenstein-eye-right.png
│   ├── frankenstein-dial.png
│   ├── skeleton-frame.webp
│   └── skeleton-trio-*.webp (if applicable)
├── audio/
│   └── AudioEngine.ts      # Web Audio API wrapper
├── player/
│   └── Player.ts           # Playlist and playback logic
├── skins/
│   ├── Skin.ts             # Skin interface
│   ├── DraculaSkin.ts      # Dracula implementation
│   ├── FrankensteinSkin.ts # Frankenstein implementation
│   ├── SkeletonSkin.ts     # Skeleton implementation
│   └── index.ts            # Skin registry
├── main.ts                 # Renderer entry point
├── openFiles.ts            # File picker integration
├── skinDrag.ts             # Window drag on character body
├── style.css               # Global styles and skin themes
└── windowShape.ts          # OS window shaping logic
```

## Kiro AI Directory (`.kiro/`)

### Specs (`.kiro/specs/`)
Feature specifications (requirements → design → implementation)

```
.kiro/specs/
├── code-optimization.md        # Code cleanup specification
├── dracula-blood-effects.md    # Blood effects feature spec
└── (future specs here)
```

**Purpose:** Document features before implementation (Kiroween requirement)

### Docs (`.kiro/docs/`)
Implementation summaries and post-mortems

```
.kiro/docs/
├── code-optimization-summary.md # Optimization results
├── dependency-upgrade.md        # Dependency upgrade log
└── workflow-improvements.md     # Workflow/steering additions
```

**Purpose:** Record what was built and lessons learned

### Steering (`.kiro/steering/`)
Development guides and conventions

```
.kiro/steering/
├── skinwalker-project.md       # Core project context (always loaded)
├── spec-template.md            # Template for new specs
├── testing-guide.md            # Testing procedures
├── css-conventions.md          # CSS patterns and rules
├── audio-guide.md              # Web Audio API patterns
└── electron-conventions.md     # Electron/IPC patterns
```

**Purpose:** Guide consistent development practices

### Hooks (`.kiro/hooks/`)
Automated checks and reminders

```
.kiro/hooks/
├── remind-spec-first.json      # Session start reminder
└── typecheck-on-save.json      # Auto-typecheck .ts files
```

**Purpose:** Enforce best practices automatically

### Workflows (`.kiro/workflows/`)
Reusable workflow recipes

```
.kiro/workflows/
└── new-skin-feature.workflow.json  # Workflow for skin features
```

**Purpose:** Standardize common development tasks

## Documentation (`docs/`)

```
docs/
├── AGENTS.md               # Project history, decisions, lessons
├── PROJECT-STRUCTURE.md    # This file
└── README.md               # Original detailed README (backup)
```

## Public Assets (`public/`)

```
public/
└── tracks/                 # Demo audio files
    ├── README.md           # Track credits and sources
    ├── nocturne-in-blood.wav
    ├── coffin-dream.wav
    ├── widows-kiss.wav
    ├── Baba_Yaga.mp3
    ├── Darkling.mp3
    └── Thief_in_the_Night.mp3
```

**Note:** Tracks are bundled with the app, not gitignored

## Reference (`reference/`)

```
reference/
├── README.md               # Documentation of reference files
└── (design images)         # Gitignored — local only
```

**Note:** Reference images are gitignored to keep repo lean

## Resources (`resources/`)

```
resources/
├── icon.icns               # macOS app icon
├── icon.ico                # Windows app icon
└── icon.png                # Linux app icon
```

## Scripts (`scripts/`)

```
scripts/
└── generate-demo-tracks.js  # Synthesize WAV demo tracks
```

## Build Output (`out/`) — Gitignored

```
out/
├── main/                   # Compiled main process
├── preload/                # Compiled preload script
└── renderer/               # Compiled renderer + assets
```

**Generated by:** `npm run build`

## Key File Purposes

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | NPM dependencies and scripts |
| `tsconfig.json` | Base TypeScript configuration |
| `tsconfig.node.json` | TypeScript for main/preload (Node) |
| `tsconfig.web.json` | TypeScript for renderer (browser) |
| `electron.vite.config.ts` | Vite build configuration |
| `.gitignore` | Git exclusion rules |

### Entry Points

| File | Process | Purpose |
|------|---------|---------|
| `src/main/index.ts` | Main | App initialization, window management |
| `src/preload/index.ts` | Preload | IPC bridge setup |
| `src/renderer/main.ts` | Renderer | UI initialization, player setup |

### Documentation

| File | Audience | Content |
|------|----------|---------|
| `README.md` | Public | Quick start, features, overview |
| `docs/AGENTS.md` | Developers | Complete project history |
| `docs/PROJECT-STRUCTURE.md` | Developers | This file |
| `LICENSE` | Legal | MIT license terms |

## File Naming Conventions

### Source Files
- **TypeScript:** `PascalCase.ts` for classes, `camelCase.ts` for utilities
- **Skins:** `{Monster}Skin.ts` (e.g., `DraculaSkin.ts`)
- **Interfaces:** Defined in separate `.ts` files or inline

### Assets
- **Images:** `{skin}-{element}.{ext}` (e.g., `dracula-frame.webp`)
- **Audio:** `{track-name}.{mp3|wav}` (lowercase with hyphens)

### Documentation
- **Specs:** `{feature-name}.md` (lowercase with hyphens)
- **Guides:** `{topic}-guide.md` or `{topic}-conventions.md`
- **Summaries:** `{topic}-summary.md`

### Meta Files
- **All caps for visibility:** `README.md`, `LICENSE`, `AGENTS.md`
- **Lowercase for configs:** `package.json`, `tsconfig.json`

## Gitignored Items

### Build Artifacts
- `node_modules/` — NPM dependencies
- `out/` — Build output
- `.vite/` — Vite cache
- `package-lock.json` — Lock file (committed in some projects, ignored here)

### Development
- `reference/**` (except `README.md`) — Design references

### Platform-Specific
- `.DS_Store` (macOS)
- `Thumbs.db` (Windows)
- `*.log` — Log files

## Best Practices

### Adding New Files

1. **Source code** → `src/{main|preload|renderer}/`
2. **Assets** → `src/renderer/assets/` or `public/`
3. **Specs** → `.kiro/specs/` (create before implementing)
4. **Documentation** → `docs/` or `.kiro/docs/`
5. **Scripts** → `scripts/`

### Adding New Features

1. Create spec in `.kiro/specs/{feature}.md`
2. Implement in appropriate `src/` directory
3. Add tests/verification
4. Document in spec's "Implementation Notes"
5. Update `docs/AGENTS.md` with lessons learned

### File Organization Rules

- **Specs BEFORE code** — Kiroween requirement
- **Keep root clean** — Only essential files at root
- **Assets near usage** — Images in `src/renderer/assets/`
- **Documentation organized** — `docs/` for public, `.kiro/docs/` for summaries

## Navigation Tips

### Finding Things

- **Feature implementation?** → `src/renderer/`
- **How does IPC work?** → `src/preload/index.ts` + `.kiro/steering/electron-conventions.md`
- **CSS patterns?** → `.kiro/steering/css-conventions.md`
- **Project history?** → `docs/AGENTS.md`
- **Feature spec?** → `.kiro/specs/`
- **Testing procedures?** → `.kiro/steering/testing-guide.md`

### Working on a Skin

1. **Implementation:** `src/renderer/skins/{Monster}Skin.ts`
2. **Styles:** `src/renderer/style.css` (search for `.{prefix}-skin`)
3. **Assets:** `src/renderer/assets/{monster}-*.{ext}`
4. **Registry:** `src/renderer/skins/index.ts` (add to SKINS array)

### Understanding Audio

1. **Engine:** `src/renderer/audio/AudioEngine.ts`
2. **Player logic:** `src/renderer/player/Player.ts`
3. **Patterns:** `.kiro/steering/audio-guide.md`
4. **Demo tracks:** `public/tracks/`

## Summary

The project follows a **clear separation of concerns:**

- **`src/`** — All source code
- **`.kiro/`** — AI-assisted development (specs, steering, hooks)
- **`docs/`** — Human-readable documentation
- **`public/`** — Static assets bundled with app
- **Root** — Essential config files only

This structure supports the **Kiroween spec-first requirement** while maintaining a **professional, maintainable codebase**.
