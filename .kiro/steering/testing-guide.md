---
inclusion: manual
name: testing-guide
description: Testing guidelines and procedures for Skinwalker features
---

# Testing Guide for Skinwalker

## Quick Test Commands

```bash
# TypeScript validation
npm run typecheck

# Development server (hot reload)
npm run dev

# Production build test
npm run build

# Package installer/binary
npm run package
```

## Feature Testing Checklist

### Audio Playback
- [ ] Click play on demo track → audio starts
- [ ] Click pause → audio stops, position holds
- [ ] Click play again → resumes from paused position
- [ ] Seek to 50% → position jumps correctly
- [ ] Volume 0% → silent, 100% → full volume
- [ ] Next track → switches and plays
- [ ] Previous track → switches and plays
- [ ] Track ends → advances to next automatically

### Visualizer
- [ ] Play track → visualizer animates
- [ ] Pause track → visualizer freezes
- [ ] Volume changes → visualizer amplitude changes
- [ ] Different tracks → visualizer responds to each
- [ ] No track playing → visualizer shows silence/baseline

### Seekbar
- [ ] Click on seekbar → jumps to position
- [ ] Drag seekbar → position updates continuously
- [ ] Blood drips animate independently
- [ ] Hover shows time tooltip (if implemented)
- [ ] All 101+ blood elements visible and animating

### Playlist
- [ ] Click track in playlist → switches to that track
- [ ] Current track highlighted
- [ ] Duration shown for each track
- [ ] Scroll works if list exceeds height
- [ ] Add files button opens file picker (if implemented)

### Window Controls
- [ ] Drag character silhouette → window moves
- [ ] Drag transparent area → no movement
- [ ] Minimize button → window minimizes
- [ ] Maximize button → window maximizes/restores
- [ ] Close button → app closes cleanly
- [ ] Window shape matches character outline

### Cross-Platform (if applicable)
- [ ] Windows: shaped window, transparency works
- [ ] macOS: fallback to rectangle, still functional
- [ ] Linux: shaped window or rectangle based on support

## Performance Testing

### Frame Rate
```javascript
// Add to renderer for FPS monitoring
let frameCount = 0;
let lastTime = performance.now();
setInterval(() => {
  const now = performance.now();
  const fps = (frameCount * 1000) / (now - lastTime);
  console.log(`FPS: ${fps.toFixed(1)}`);
  frameCount = 0;
  lastTime = now;
}, 1000);

requestAnimationFrame(function count() {
  frameCount++;
  requestAnimationFrame(count);
});
```

Target: **60 FPS** during playback with visualizer

### Memory Usage
- Open DevTools → Performance → Record 30s of playback
- Check memory stays stable (no continuous growth)
- Max heap should be < 100MB for this app

### CPU Usage
- Task Manager while playing
- Should be < 5% on modern CPU when idle
- Spikes during track load are acceptable

## Regression Testing

After any change, verify these still work:

### Core Functionality
- [ ] Play/pause toggle
- [ ] Seek forward and backward
- [ ] Volume up and down
- [ ] Next/previous track
- [ ] Playlist selection

### Visual Elements
- [ ] Character frame renders correctly
- [ ] Visualizer animates smoothly
- [ ] Blood effects animate
- [ ] No visual glitches or z-index issues
- [ ] Text readable against background

### Window Behavior
- [ ] Window draggable
- [ ] Window shape correct
- [ ] Transparency works
- [ ] Controls clickable

## Bug Report Template

When filing issues:

```markdown
**Bug:** [One-line description]

**Expected:** [What should happen]

**Actual:** [What actually happens]

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Environment:**
- OS: [Windows 11 / macOS 14 / Ubuntu 22.04]
- Display Scale: [100% / 150% / 200%]
- Electron Version: [from package.json]
- Build Type: [dev / production]

**Console Output:**
```
[Paste any errors]
```

**Screenshot:** [If visual bug]
```

## Acceptance Testing (Before Ship)

All items from AGENTS.md must pass:
- [ ] Load a track, play it — audio never interrupts
- [ ] Every visible control in every skin works
- [ ] Visualizer driven by real audio signal
- [ ] Frameless window drags/minimizes/maximizes/closes
- [ ] Native file picker adds local tracks
- [ ] `npm run build` produces working binary
- [ ] App runs from clean install with no dependencies

## Pre-Commit Security Checklist

**CRITICAL:** Review every file before committing to public repo

### Absolute Paths (NEVER COMMIT)
- [ ] Search for `C:\Users\` or `/home/` or `~/`
- [ ] Search for machine-specific usernames
- [ ] Search for absolute paths in: code, comments, specs, docs
- [ ] Verify all paths are repo-relative (e.g., `src/main.ts`)

### Secrets & Credentials (NEVER COMMIT)
- [ ] No API keys, tokens, passwords
- [ ] No private keys or certificates
- [ ] No email addresses or personal contact info
- [ ] No `.env` files with real values
- [ ] Check for accidentally committed credentials in git history

### Personal Information (NEVER COMMIT)
- [ ] No full names unless public contributors
- [ ] No machine names (hostname, computer name)
- [ ] No internal network paths
- [ ] No company-internal references

### Pre-Commit Review Commands
```bash
# Search for common violations before committing
git diff --cached | grep -i "c:\\\|/home/\|users/"
git diff --cached | grep -i "password\|secret\|token\|api.key"

# Review every changed file
git diff --cached --name-only
git diff --cached <filename>  # Review each file

# If violations found, STOP and fix before committing
```

### Safe Submission Checklist
- [ ] Review `git diff` for every changed file
- [ ] All paths are repo-relative
- [ ] No secrets or credentials
- [ ] No personal information
- [ ] Screenshots contain no desktop UI with paths
- [ ] Demo video shows only the app, not file explorer
- [ ] Devpost text has no absolute paths
- [ ] README has no absolute paths

## Pre-Commit Security Checklist

**CRITICAL:** Review every file before committing to public repo

### Absolute Paths (NEVER COMMIT)
- [ ] Search for `C:\Users\` or `/home/` or `~/`
- [ ] Search for machine-specific usernames (TBMT, etc.)
- [ ] Search for absolute paths in: code, comments, specs, docs
- [ ] Verify all paths are repo-relative (e.g., `src/main.ts`)

### Secrets & Credentials (NEVER COMMIT)
- [ ] No API keys, tokens, passwords
- [ ] No private keys or certificates
- [ ] No email addresses or personal contact info
- [ ] No `.env` files with real values
- [ ] Check for accidentally committed credentials in git history

### Personal Information (NEVER COMMIT)
- [ ] No full names unless public contributors
- [ ] No machine names (hostname, computer name)
- [ ] No internal network paths
- [ ] No company-internal references

### Pre-Commit Commands
```bash
# Search for common violations
git diff --cached | grep -i "c:\\\|/home/\|users/"
git diff --cached | grep -i "password\|secret\|token\|api.key"
git diff --cached | grep -i "TBMT"

# If any found, STOP and fix before committing
```

### Safe Submission Checklist
- [ ] Review `git diff` for every changed file
- [ ] All paths are repo-relative
- [ ] No secrets or credentials
- [ ] No personal information
- [ ] Screenshots contain no desktop UI with paths
- [ ] Demo video shows only the app, not file explorer

## Performance Acceptance Criteria

- [ ] Application starts in < 3 seconds
- [ ] Track loads in < 1 second
- [ ] Visualizer maintains 60 FPS
- [ ] No memory leaks over 10-minute session
- [ ] CPU < 5% during playback
- [ ] Binary size < 200MB

## Accessibility Checklist

- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] ARIA labels on custom controls
- [ ] No keyboard traps
- [ ] Color contrast sufficient for text
- [ ] Decorative elements have aria-hidden="true"
