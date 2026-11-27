# `.kiro/` Index

What each Kiro artifact in this repo is, and what it actually did.
Timestamps come from `git log` (commit time, Pacific). Re-check with
`git log --format='%h %ad %s' --date=iso -- .kiro`.

## Specs (`.kiro/specs/`)

| File | First commit | Status | Honest note |
|------|--------------|--------|-------------|
| `dracula-blood-effects.md` | `ba0284e`, 2026-11-11 01:16 | Partially implemented | Committed after the drip code (`662ba10`, 2026-11-10 11:31). Describes splatter and trails that were never committed. Retrospective. |
| `code-optimization.md` | `0d5711b`, 2026-11-11 01:21 | Complete | Committed in the same commit as its first change (a 10-line CSS edit). |
| `submission-readiness.md` | 2026-11-20 | Complete | Spec for the audit and submission drafts. Docs only. |
| `code-asset-optimization.md` | 2026-11-24 (`25fede9`) | Complete | Committed with a measured baseline before its changes (`ae8edd5`, `04ceaf3`, `5d26469`). |
| `frankenstein-volume-readout.md` | 2026-11-24 (`d114350`) | Implemented, visual check pending | Committed before its CSS change (`594bcde`). |
| `frankenstein-mask-no-stitches.md` | 2026-11-24 (`189958e`) | Implemented, visual check pending | Committed before its change (`6944734`). |
| `skeleton-one-blue.md` | 2026-11-25 (`94e1e13`) | Reverted | Three colour revisions, each spec-first; all reverted at the maintainer's request (`c9721d8`). |
| `skeleton-seek-thumb.md` | 2026-11-26 (`032d172`) | Implemented (maintainer's image) | Earlier Kiro attempts were removed from history; the committed spec and image came with the maintainer's own commit. Not spec-first. |
| `asset-optimization-2.md` | 2026-11-26 (`f9efa4d`) | Complete | Committed with a measured baseline before its change (`111eceb`). |
| `remember-last-skin.md` | 2026-11-23 (`3dedc7f`) | Implemented, runtime check pending | Committed before its code (`bd6293f`). |
| `skin-required-controls.md` | 2026-11-21 | Implemented | Audit of the 10 required controls per skin. Written before the Skeleton and Frankenstein window tools were built. Frankenstein's minimize closed 2026-11-24. |

## Steering (`.kiro/steering/`)

| File | Inclusion | Purpose |
|------|-----------|---------|
| `skinwalker-project.md` | always | Project identity, scope, standing rules (spec-first, no absolute paths, no secrets). |
| `css-conventions.md` | auto | CSS naming and structure for skins. |
| `audio-guide.md` | auto | Web Audio API and AnalyserNode patterns. |
| `electron-conventions.md` | auto | Main/preload/renderer and IPC conventions. |
| `skin-required-controls.md` | auto | The 10 controls every skin must provide (playback, volume, seek, track board, 5 window buttons). All three skins carry the ten controls since 2026-11-24. |
| `spec-template.md` | manual | Template for new specs. |
| `testing-guide.md` | manual | Pre-completion checklist. |
| `understanding-kiro.md` | manual | Explainer on specs, steering, hooks, workflows. |

## Hooks (`.kiro/hooks/`)

| File | Trigger | What it does |
|------|---------|--------------|
| `remind-spec-first.json` | SessionStart | Agent prompt: spec first, no absolute paths, no secrets, read `docs/AGENTS.md`. |
| `security-check.json` | UserPromptSubmit matching `commit\|push\|git` | Agent prompt: scan the diff for absolute paths, secrets, personal info. |
| `typecheck-on-save.json` | PostFileSave on `.ts` | Runs `npm run typecheck`. |

## Workflows (`.kiro/workflows/`)

- `new-skin-feature.workflow.json`: template for spec, implement, test on a skin.
  [MAINTAINER: say whether you ever ran it. It is not evidence of use on its own.]

## Docs (`.kiro/docs/`, `.kiro/QUICK-REFERENCE.md`)

Notes on rules, compliance and dependency upgrades. `kiroween-compliance-check.md`
is superseded by `docs/submission/AUDIT.md`.

## Not used

- MCP servers: none configured (`.kiro/settings/` does not exist).
- Custom agents, Kiro powers, property-based tests: none in the repo.
- Automated tests: none. Validation is `npm run typecheck` and `npm run build`.

## What was NOT built from a spec

`.kiro/` first appears in commit `ba0284e` (2026-11-11 01:16). Everything in
`src/` before that commit has no spec in the repo:

- Electron migration, window shaping, drag, IPC (2026-11-08 to 2026-11-10).
- `AudioEngine`, `Player`, playlist, file picker.
- All three skins (Dracula, Frankenstein, Skeleton) and their art plates.
- Demo track wiring and attribution.
- App icon (2026-11-11 and 2026-11-12, after the specs).
- Dependency upgrade (documented in `.kiro/docs/dependency-upgrade.md`, no spec).

Only the Dracula blood effects (since reworked) and one CSS-variable change have a spec, and
both specs were written at or after the code. Later Dracula work (painted blood line, hand glow masks, mini bat repair, medallion pause face, playlist restyle, window-shape scaling, skin cycling, file picker fixes, commits `4598551` to `9c67d6d`) has no spec; it is recorded only in `docs/AGENTS.md`. The same holds for the 2026-11-22 and 2026-11-23 skin rebuilds (Dracula volume crosses, eye bloom, cape curtain, mini hover; Skeleton tools and mini card; the Frankenstein rebuild) and the 2026-11-24 work (Skeleton sprite tool icons, pendant glyphs, muted styling; the Frankenstein mouth-mask playlist monitor, `0e1b21b` and `0100a68`) and the 2026-11-25/26 Skeleton work (frame re-cuts, toolbar alignment, painted row skulls, mouth EQ redraw, eye-socket image and beat bloom, prev/next glows, marquee readouts with the Pirata One font, mini-card glyphs, the `hasPlayed` audio latch): `skin-required-controls.md` lists the controls they had to provide, but their visual design has no spec.
