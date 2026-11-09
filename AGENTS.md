# AGENTS.md — Skinwalker

Kiroween 2026 entry — **Costume Contest**. Read this file first in every session on this project.

## Status
- Name **Skinwalker** — CONFIRMED 2026-11-08. (Proposed 2026-11-06; collision check run 2026-11-06 — CLEAR: no repo by that name in the `lanly-dev` namespace (66 repos checked) and no media player by that name found. Watch-outs noted and accepted: the word is used elsewhere, including horror games / Skinwalker Ranch, and it is a Navajo figure with a taboo around casual use. Trademark registers and domain availability were not checked.)
- Repo `lanly-dev/skinwalker` — **not yet created**. Do not create it, register anything, or request credits until given the go in this project's side chat.
- Deadline for the whole hackathon: **Fri Dec 4, 2026, 2:00 PM PT**. Credit request (shared 4,000-credit pool, one code per entrant) due **Dec 1, 12:00 PM PT**.

## What this is
A media player where the skin is a living Halloween monster. Media player skins (Winamp / Windows Media Player era) are the interface: swapping skins swaps monsters, and the monster's body parts are the working controls — the skin enhances function, which is exactly what Costume Contest judges score.

## Category fit
Costume Contest: a haunting UI that is polished/unforgettable AND where the spooky elements do functional work. Every monster element must be a control or a readout, never decoration pasted on a normal player.

## Hard rules (Kiroween)
- New project, built during the window, core implementation built by **Kiro, spec-first**: spec committed in `/.kiro` before implementation code.
- `/.kiro` at repo root (specs, steering, hooks), never gitignored. MIT license file visible at repo top.
- Other agents (Claude etc.) may plan, prototype throwaway code, write docs, and prep assets. They may not write the core app — that is Kiro's job, and the `/.kiro` history must honestly show it. Any carried-over code gets a one-line disclosure on Devpost.
- Kiro credit budget for this entry: **~900** of the shared 4,000. Explore elsewhere, execute in Kiro.
- **No absolute paths (standing rule, 2026-11-07).** Nothing that leaves this machine — code, comments, specs, docs, commit messages, READMEs, screenshots, Devpost text — may contain an absolute local path (no `/home/<user>/...`, no `~/workspace/...`, no `C:\Users\...`). Reference files by repo-relative path only (e.g. `src/app.ts`, `/.kiro/specs/...`). The local directory layout is private and must never leak into the public repo or the submission.

## Scope v1
- All client-side web app; local audio files + bundled royalty-free demo tracks.
- Core player: play / pause / seek / volume, playlist, next / prev.
- **At least 3 monster skins**, swappable mid-playback without stopping the track.
- Per skin, functional anatomy: e.g. mouth or eyes as the live visualizer (Web Audio AnalyserNode), claw / tongue / vine as the seek bar, skin-themed play/pause and volume organs.
- One skin is the design flagship — polish it hardest; the other two can be simpler but must be fully functional skins, not color swaps.

## Non-goals (scope caps — do not cross without explicit approval)
- **No spectrogram / file-quality analysis.** That is SpectreGram, the sibling Resurrection entry. A simple live visualizer is fine; analysis features would blur the two entries and endanger the "substantially different" rule.
- No streaming-service logins, no accounts, no backend, no uploads.
- Demo and demo-video audio: royalty-free / own tracks only (copyrighted music in the video is a rules violation).

## Acceptance checks (must all pass before "done")
- [ ] Load a track, play it, swap all 3 skins mid-play — audio never interrupts.
- [ ] Every visible control in every skin actually works (seek, volume, playlist).
- [ ] Visualizer is driven by the real audio signal, not a fake animation loop.
- [ ] Works from the public URL with no login, in a fresh browser profile.

## Packaging checklist
- [ ] Working app URL (static hosting is fine), public repo + MIT license + `/.kiro`.
- [ ] Demo video < 3 min, public YouTube: play a track → swap skins mid-song → close-up of one skin where the anatomy IS the control.
- [ ] Devpost text description + Kiro-usage write-up (specs vs vibe coding, hooks, steering used).
- [ ] Blog post about the build (Bonus Blog prize) + one social post starting with `#KiroweenHackathon26` (Social Blitz).

## Decisions
- **Name: Skinwalker — CONFIRMED 2026-11-08** (collision check CLEAR 2026-11-06, watch-outs accepted; see Status).

## Open decisions
1. Stack detail: plain web (HTML/JS) vs a framework — keep it light; decide at spec time.
2. Which 3 monsters ship as skins?

## How we work
Plan → Work → Assess → Compound. When a session earns a lesson (a bug's real cause, a workflow that works), write it into this file the moment it is earned. When a decision above is made, update the Open decisions section in the same session — undecided items stay visibly undecided, never silently assumed.
