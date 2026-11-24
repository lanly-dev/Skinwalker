# Submission Audit

Audited 2026-11-20 at the repo root on branch `main`. Rows 18, 19 and 29 re-checked 2026-11-22 at `9c67d6d`; other rows were not re-run. Rules source:
https://kiroween.devpost.com/rules (fetched 2026-11-20; checklist in `docs/AGENTS.md`).
Submission closes Fri 2026-12-04 2:00 PM PT.

PASS = checked with a command or file read this session. FAIL = checked and wrong.
UNVERIFIED = could not be checked here.

## Results

| # | Requirement (rules quote) | Result | Evidence |
|---|---------------------------|--------|----------|
| 1 | "The repository must be public" | PASS | GitHub API `GET /repos/lanly-dev/Skinwalker`: `"private":false`, `"visibility":"public"`. |
| 2 | "open source license ... detectable and visible ... in the About section" | PASS (About-box display UNVERIFIED) | API: `license.spdx_id` = `MIT`. `LICENSE` is MIT. The About sidebar itself was not viewed. The API `description` is `null`, so the About box has no description. |
| 3 | "/.kiro directory at the root" | PASS | 20 tracked files under `.kiro/` (`git ls-files .kiro`). |
| 4 | "Do NOT add the /.kiro directory ... to your .gitignore" | PASS | `git check-ignore -v .kiro .kiro/specs` prints nothing. |
| 5 | "GitHub (NOT GitLab or BitBucket)" | PASS | `origin` is `github.com/lanly-dev/Skinwalker`. |
| 6 | New project, built in the Submission Period (from 2026-10-30) | PASS | First commit 2026-11-08 (`321c972`). GitHub `created_at` 2026-11-09. |
| 7 | "must disclose any other pre-existing code or work" | FAIL (disclosure missing) | `docs/AGENTS.md` says the Dracula plate was "extracted from the reference copy of the web page" of a "Boba web build", and that character art was "generated". No public disclosure of who made the web build, who owns the art, or which tool generated it. See Open Risks 1 and 2. |
| 8 | No absolute local paths in tracked files | PASS | `git grep -n -I -E 'C:\\Users\|/home/[a-z]'` has hits only in rule text that names the pattern (hook prompts, `docs/AGENTS.md`, steering). No real paths. |
| 9 | No personal info in tracked files | PASS after fix | The local OS login name appeared in 3 tracked files. Removed in this audit. Maintainer's first name "Lan" appears 10 times in `docs/AGENTS.md`; it matches the public GitHub author name. [MAINTAINER: keep or remove.] |
| 10 | No secrets or `.env` in tracked files | PASS | No `.env`, `.pem`, `.key` in `git ls-files`. Pattern grep for key/secret/password/token finds only rule text. |
| 11 | Same checks across git history (report only) | FAIL (reported, not rewritten) | The local login name is in the history in commits `e531b3d` and `872c86e` (2026-11-11). Author identity is the GitHub noreply address. No secrets or env files in history (`git log --all --name-only`). Rewriting published history is not recommended; the exposure is a login name inside docs text. [MAINTAINER: decide.] |
| 12 | Ignored files are untracked | PASS | `out/`, `node_modules/`, `.vite/`, `package-lock.json`, `reference/**` not tracked (except `reference/README.md`, intentionally). `dist/` and `release/` were not ignored; added to `.gitignore`. `.freebuff/` is self-ignored by its own `.gitignore`. |
| 13 | `package-lock.json` | FAIL (reproducibility) | Listed in `.gitignore` and not tracked. A judge's `npm install` resolves fresh versions (`electron ^45`, `typescript ^7`). Fix is a decision for the maintainer. |
| 14 | Third-party music licensed | PASS (attribution in app UNVERIFIED) | `public/tracks/README.md` and README credit Kevin MacLeod, CC BY 4.0, with source URLs. The track list in `src/renderer/main.ts` shows "Kevin MacLeod" as artist. Whether the license text is shown in the packaged app was not checked. |
| 15 | Synthetic track artist label | UNVERIFIED (risk) | `src/renderer/main.ts` labels a track "Bathory • Eternal Night". Bathory is a real band. The tracks README says it is "fictional styling". Cheapest fix: rename the label. |
| 16 | Art and image provenance | UNVERIFIED | No license or source for the five plate/layer images in `src/renderer/assets/`. [MAINTAINER: state source and tool.] |
| 17 | Fonts | UNVERIFIED | `src/renderer/style.css` names `'Cinzel Decorative'` with no `@font-face` and no font file in the repo. It falls back to system fonts on machines without it. |
| 18 | Typecheck passes | PASS | `npm run typecheck` exit 0 (re-run 2026-11-22 at `9c67d6d`). |
| 19 | Build passes | PASS | `npm run build` exit 0 (re-run 2026-11-22 at `9c67d6d`). |
| 20 | Tests pass | N/A | The repo has no test script and no tests. |
| 21 | App runs | PASS (partial) | `dist/win-unpacked/skinwalker.exe` stayed running 8 s after launch on Windows 11. No UI was seen. Playback, controls and window shape were not exercised. |
| 22 | Installer builds | PASS | `npm run package` exit 0 on current HEAD; produced `dist/skinwalker Setup 0.1.0.exe` (174.6 MB, NSIS, unsigned). An earlier run of the same command returned exit 1 with no error text in the last 25 lines; the retry succeeded. |
| 23 | Installer branding | FAIL | electron-builder logs "default Electron icon is used. reason=application icon is not set". `resources/icon.png` is only used for the runtime window icon (`src/main/index.ts`). |
| 24 | Install steps work as described | UNVERIFIED | The installer was not run. SmartScreen will likely warn (unsigned). |
| 25 | "Provide a URL to your functional application" / release assets | FAIL | `GET /repos/lanly-dev/Skinwalker/releases` returns `[]`. No downloadable build exists. Judges can still build from source. |
| 26 | Demo video under 3 min on public YouTube | UNVERIFIED | Not made by this audit. Needs [YOU]. |
| 27 | Kiro usage write-up | PASS (draft) | `docs/submission/kiro-usage.md`. Needs maintainer facts. |
| 28 | Linux and macOS | UNVERIFIED | Only Windows was used. `setShape` is skipped on macOS by code. |
| 29 | Local repo in sync with remote | PASS | 2026-11-22: `HEAD` equals `origin/main` (`9c67d6d`). |
| 30 | `npm run dev` from a fresh install | FAIL then fixed locally | Failed with "Electron uninstall": `node_modules/electron/path.txt` was missing because Electron's download step had not run. Fixed by running `node node_modules/electron/install.js`; README Quick Start now explains this. A second failure, `listen EACCES ::1:5173`, came from a Windows reserved port range; the dev server now uses port 5500 (`electron.vite.config.ts`, commit `445317a`). |
| 31 | Docs cite files outside the repo | FAIL | `docs/AGENTS.md` cites `reference/dracula-web/*` scripts. `reference/**` is gitignored. See the note at the end of `docs/AGENTS.md`. |
| 32 | Return from Skeleton or Frankenstein | PASS (from source) | All three skins have a next-skin control (2026-11-22 and 2026-11-23). Not clicked in the running app. |
| 33 | Ten required controls per skin | PASS (from source) | `.kiro/specs/skin-required-controls.md`: all three skins carry the ten controls; Frankenstein's minimize pin landed 2026-11-24. Not clicked in the running app. |

## Open Risks (need the maintainer)

1. **Pre-existing web build.** The Dracula plate and the player behaviour are described in `docs/AGENTS.md` as copied or matched from a "Boba web build" at boba.page. If that is the maintainer's own earlier project, the rules require disclosing it as pre-existing work. If it is someone else's, the art may violate "not violate the IP rights of any other person". [MAINTAINER: who made it, and is it yours?]
2. **AI-generated art.** AGENTS.md says the character art was "generated". [MAINTAINER: which tool, and do its terms allow this use?]
3. **Mixed tooling.** `docs/AGENTS.md` records other agents prepared assets (SAM attempt, color segmentation). The repo rule says Kiro must write the core app. `.kiro/` was first committed on 2026-11-11, after all `src/` files existed. Judges can see that in `git log`. [MAINTAINER: which parts were written in Kiro, from your own memory and session history.]
4. **Retrospective specs.** See `.kiro/INDEX.md`.

## Judging criteria map

| Criterion | Weakest point | Cheapest honest fix |
|-----------|---------------|---------------------|
| Potential Impact | A media player is not a new problem. | Say so. Frame as a UI craft entry for the Costume Contest, not a utility. |
| Technological Implementation (Kiro use) | Specs came after code. No MCP, custom agents, PBT or tests. Hooks are reminders plus one typecheck. | State it plainly in `docs/submission/kiro-usage.md`. Write the next change spec-first (T6 of this spec is an example) and show its timestamps. |
| Design | Window shape and plates not visually verified in this audit. Installer shows the default Electron icon. | Maintainer checks on Windows and records the video. Set the installer icon (decision for maintainer; config only). |
| Innovation | Skin-as-controls idea is clear; Winamp-style skins exist. | Lead with the anatomy table in `docs/README.md`. |
| Presentation | No video, no release, no About description. | Record the video from `docs/submission/demo-script.md`. Publish a GitHub release. Add an About description. |

## Not done here (needs your account)

See the numbered list at the end of the audit report in chat, and the markers in `docs/submission/`.
