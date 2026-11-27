# Submission Audit

Audited 2026-11-20 at the repo root on branch `main`. **Full re-run 2026-11-24 at `b377da0`** (equal to `origin/main`); every row below was re-checked that day unless it says otherwise. Rules source:
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
| 11 | Same checks across git history (report only) | FAIL (reported, not rewritten) | 2026-11-24: `git log --all -S` finds the local login name in 3 commits (2 that added it on 2026-11-11, 1 that removed it, `e8953b3`). No secrets or env files in history. Only author address is the GitHub noreply address. [MAINTAINER: decide.] |
| 12 | Ignored files are untracked | PASS | `git ls-files` lists nothing under `out/`, `dist/`, `release/`, `node_modules/`, `.vite/`; no `.env`, `.pem`, `.key`. Local tool folders (including `.cloud-attachments/`) are untracked. |
| 13 | `package-lock.json` | PASS | Tracked as of 2026-11-24 and no longer in `.gitignore`. |
| 14 | Third-party music licensed | PASS (attribution in app UNVERIFIED) | `public/tracks/README.md` and README credit Kevin MacLeod, CC BY 4.0, with source URLs. The track list in `src/renderer/main.ts` shows "Kevin MacLeod" as artist. Whether the license text is shown in the packaged app was not checked. |
| 15 | Synthetic track artist label | UNVERIFIED (risk) | `src/renderer/main.ts` labels a track "Bathory • Eternal Night". Bathory is a real band. The tracks README says it is "fictional styling". Cheapest fix: rename the label. |
| 16 | Art and image provenance | UNVERIFIED | No license or source for the five plate/layer images in `src/renderer/assets/`. [MAINTAINER: state source and tool.] |
| 17 | Fonts | FAIL | 2026-11-26: Pirata One is bundled (`src/renderer/assets/fonts/pirata-one.woff2`, `@font-face` in `style.css`) and the CSS credits SIL OFL 1.1 at `assets/fonts/OFL.txt`, but that file does not exist; the OFL requires the licence text to ship with the font. `Cinzel Decorative` is still named without a font file and falls back to system fonts. |
| 18 | Typecheck passes | PASS | `npm run typecheck` exit 0 (re-run 2026-11-22 at `9c67d6d`). |
| 19 | Build passes | PASS | `npm run build` exit 0 (re-run 2026-11-22 at `9c67d6d`). |
| 20 | Tests pass | N/A | The repo has no test script and no tests. |
| 21 | App runs | PASS (partial) | 2026-11-24: `dist/win-unpacked/skinwalker.exe` stayed running 8 s on Windows. No UI was inspected; controls, playback and shape were not exercised by this audit. |
| 22 | Installer builds | PASS | 2026-11-24: `npm run package` exit 0; `dist/skinwalker Setup 0.1.0.exe` is 140.0 MB after the packaging fix (295.1 MB before). Unsigned. |
| 23 | Installer branding | PASS | 2026-11-24: `build.win.icon` set to `resources/icon.png`; electron-builder no longer logs the default-icon message. Icon not inspected in Explorer. |
| 24 | Install steps work as described | UNVERIFIED | The installer was not run. SmartScreen will likely warn (unsigned). |
| 25 | "Provide a URL to your functional application" / release assets | FAIL | 2026-11-24: `GET /repos/lanly-dev/Skinwalker/releases` returns `[]`. API `description` is still `null`. |
| 26 | Demo video under 3 min on public YouTube | UNVERIFIED | Not made by this audit. Needs [YOU]. |
| 27 | Kiro usage write-up | PASS (draft) | `docs/submission/kiro-usage.md`. Needs maintainer facts. |
| 28 | Linux and macOS | UNVERIFIED | Only Windows was used. `setShape` is skipped on macOS by code. |
| 29 | Local repo in sync with remote | PASS | 2026-11-24: `HEAD` equals `origin/main` (`b377da0`). |
| 30 | `npm run dev` from a fresh install | FAIL then fixed locally | Failed with "Electron uninstall": `node_modules/electron/path.txt` was missing because Electron's download step had not run. Fixed by running `node node_modules/electron/install.js`; README Quick Start now explains this. A second failure, `listen EACCES ::1:5173`, came from a Windows reserved port range; the dev server now uses port 5500 (`electron.vite.config.ts`, commit `445317a`). |
| 31 | Docs cite files outside the repo | FAIL | `docs/AGENTS.md` cites `reference/dracula-web/*` scripts. `reference/**` is gitignored. See the note at the end of `docs/AGENTS.md`. |
| 32 | Return from Skeleton or Frankenstein | PASS (from source) | All three skins have a next-skin control (2026-11-22 and 2026-11-23). Not clicked in the running app. |
| 33 | Ten required controls per skin | PASS (from source) | 2026-11-24: all three skin files wire close, minimize, next skin, open folder, mini, play/pause, prev/next, seek, volume and the playlist (grep of `src/renderer/skins/*Skin.ts`). Not clicked in the running app. |
| 34 | Installer contains only what the app needs | PASS | 2026-11-24: `build.files` in `package.json` limits the asar to `out/**`, `resources/**`, `package.json`. `npx @electron/asar list` shows only those (26.95 MB, was 238.7 MB). See `.kiro/specs/code-asset-optimization.md`. |

## Open Risks (need the maintainer)

1. **Pre-existing web build.** The Dracula plate and the player behaviour are described in `docs/AGENTS.md` as copied or matched from a "Boba web build" at boba.page. If that is the maintainer's own earlier project, the rules require disclosing it as pre-existing work. If it is someone else's, the art may violate "not violate the IP rights of any other person". [MAINTAINER: who made it, and is it yours?]
2. **AI-generated art.** AGENTS.md says the character art was "generated". [MAINTAINER: which tool, and do its terms allow this use?]
3. **Mixed tooling.** `docs/AGENTS.md` records other agents prepared assets (SAM attempt, color segmentation). The repo rule says Kiro must write the core app. `.kiro/` was first committed on 2026-11-11, after all `src/` files existed. Judges can see that in `git log`. [MAINTAINER: which parts were written in Kiro, from your own memory and session history.]
4. **Retrospective specs.** See `.kiro/INDEX.md`.
5. **Installer ships private and third-party files (row 34).** Fixed 2026-11-24. Installers built before commit `ae8edd5` contain `reference/` and other local files; do not publish those.

## Judging criteria map

| Criterion | Weakest point | Cheapest honest fix |
|-----------|---------------|---------------------|
| Potential Impact | A media player is not a new problem. | Say so. Frame as a UI craft entry for the Costume Contest, not a utility. |
| Technological Implementation (Kiro use) | Specs came after code. No MCP, custom agents, PBT or tests. Hooks are reminders plus one typecheck. | State it plainly in `docs/submission/kiro-usage.md`. Point to the changes that were spec-first and show their timestamps: `remember-last-skin.md` (`3dedc7f`) before `bd6293f`, and the `skin-required-controls.md` audit (2026-11-21) before the Skeleton and Frankenstein window tools. |
| Design | Window shape and plates not visually verified in this audit. Packaging fixed 2026-11-24 (rows 23, 34). | Maintainer checks on Windows and records the video. |
| Innovation | Skin-as-controls idea is clear; Winamp-style skins exist. | Lead with the anatomy table in `docs/README.md`. |
| Presentation | No video, no release, no About description. | Record the video from `docs/submission/demo-script.md`. Publish a GitHub release. Add an About description. |

## Not done here (needs your account)

See the numbered list at the end of the audit report in chat, and the markers in `docs/submission/`.
