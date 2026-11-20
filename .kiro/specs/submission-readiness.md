# Submission Readiness Specification

**Status:** In Progress
**Created:** 2026-11-20
**Owner:** Maintainer
**Implementation:** Kiro (docs and audit only; no feature code)

## Overview
Make the repo and the Devpost submission match the Kiroween 2026 rules and
match reality. Audit the repo against the rules, correct stale or untrue
claims in docs, and draft the submission texts. No new product features.

## Requirements
### Functional Requirements
- [x] R1: Rules checklist lives in `docs/AGENTS.md`, checked against the live rules page.
- [ ] R2: Every checklist item audited with a real command or file read and marked PASS / FAIL / UNVERIFIED in `docs/submission/AUDIT.md`.
- [x] R3: No doc claims a result that was not observed. Untestable claims are marked UNVERIFIED.
- [ ] R4: `.kiro/INDEX.md` lists every steering file, hook, spec and workflow, and what each does, plus an honest list of what was not built from a spec.
- [ ] R5: Drafts in `docs/submission/`: description, Kiro usage write-up, demo script, blog post, social post (starts with `#KiroweenHackathon26`).
- [ ] R6: Anything only the maintainer knows is marked `[MAINTAINER: ...]` or `[YOU: ...]`.

### Non-Functional Requirements
- No absolute local paths, usernames, or secrets in any file or commit.
- Published history is not rewritten. History findings are reported only.
- Nothing is pushed, published or submitted without maintainer approval.

## Tasks
- [x] T1: This spec.
- [x] T2: Rules checklist verified against live rules (R1).
- [x] T3: Remove username from tracked files; ignore `dist/` (R2).
- [x] T4: Correct stale claims in README, docs, steering, specs (R3).
- [ ] T5: `.kiro/INDEX.md` and `docs/submission/AUDIT.md` (R2, R4).
- [ ] T6: Submission drafts (R5, R6).

## Acceptance Criteria
- `npm run typecheck` and `npm run build` pass.
- `git grep` for the local username and absolute user paths returns no tracked-file hits (the username is not named in this spec on purpose).
- Every claim in README matches code or is marked UNVERIFIED.

## Implementation Notes
Written 2026-11-20, after the product code. This spec covers docs and audit
work only, so it is not an example of spec-before-feature-code.
