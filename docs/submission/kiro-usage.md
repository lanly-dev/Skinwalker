# How Kiro Was Used (draft)

Every statement below is from the repo or `git log`. Anything about your experience is a marker for you to fill in.

## Kiro surfaces
[YOU: which of Kiro IDE, CLI, Web, Crew you used, and how they differed. The repo cannot show this.]

## Specs
- Five specs in `.kiro/specs/`: `dracula-blood-effects.md`, `code-optimization.md`, `submission-readiness.md`, `skin-required-controls.md`, `remember-last-skin.md`.
- The first two were committed on 2026-11-11, after the code they describe. The blood-effects spec lists elements (splatter, trails) that were never committed. Its status line now says so.
- `submission-readiness.md` was committed before its docs-only work, one task per commit.
- `skin-required-controls.md` (audit, 2026-11-21) was written before the Skeleton and Frankenstein window tools; `remember-last-skin.md` (`3dedc7f`) was committed before its code (`bd6293f`). Check with `git log --format='%h %ad %s' --date=iso -- .kiro/specs src/renderer/lastSkin.ts`.
- Most of the player and all three skins were built before any spec existed. There is no evidence in the repo for a spec-driven vs vibe-coding comparison.
- [YOU: if you drove the early work in Kiro chat without specs, say so. That is a fair "vibe coding" account.]

## Steering
Eight files in `.kiro/steering/`. One is always included (`skinwalker-project.md`: scope, standing rules). Four are auto-included (CSS, audio, Electron conventions, required skin controls). Three are manual (spec template, testing guide, Kiro explainer). See `.kiro/INDEX.md`.
[YOU: which steering file changed Kiro's output most, with an example. Do not guess.]

## Hooks
- `remind-spec-first.json` (SessionStart): reminds about spec-first, no absolute paths, no secrets.
- `security-check.json` (prompts matching commit/push/git): reminds to scan the diff for paths, secrets and personal info.
- `typecheck-on-save.json` (save of `.ts`): runs `npm run typecheck`.
[YOU: did any hook catch a real problem? If not, say they were guard rails.]

## Workflows
`.kiro/workflows/new-skin-feature.workflow.json`. [YOU: say whether it was run.]

## Not used
MCP, custom agents, Kiro powers, property-based testing. The repo has no automated tests; checks are `npm run typecheck` and `npm run build`.

## Honest limits
`.kiro/` first appears in commit `ba0284e` (2026-11-11), after the `src/` tree. Other tools were also used for asset preparation (see `docs/AGENTS.md`). [MAINTAINER: describe the split between Kiro and other tools.]