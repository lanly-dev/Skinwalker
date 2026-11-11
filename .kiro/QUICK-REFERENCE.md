# Kiro Quick Reference Card

One-page guide to Kiro concepts for Skinwalker.

## The Four Pillars

```
📋 SPECS          🧭 STEERING        🪝 HOOKS          🔄 WORKFLOWS
Design first      Guide AI work      Automate checks   Multi-step tasks
.kiro/specs/      .kiro/steering/    .kiro/hooks/      .kiro/workflows/
```

---

## 📋 Specs (Specifications)

**What:** Feature design documents created BEFORE code

**Structure:**
```
# Feature Name

Status: Draft | In Progress | Complete
Created: YYYY-MM-DD

## Overview
What and why (2-3 sentences)

## Requirements
- Functional (what user does)
- Technical (how it works)
- Non-functional (performance, compatibility)

## Design Approach
- Architecture
- Key components
- Data flow

## Implementation Tasks
- Phase 1: Foundation
- Phase 2: Core
- Phase 3: Polish

## Acceptance Criteria
Must pass ALL before "done"

## Implementation Notes (after)
- What changed
- Lessons learned
```

**When to create:** Any new feature, skin, or major change

**Template:** `.kiro/steering/spec-template.md`

**Example:** `.kiro/specs/dracula-blood-effects.md`

---

## 🧭 Steering (Guidance Files)

**What:** Convention guides that shape how AI works

**Frontmatter Types:**

```yaml
---
inclusion: always
---
# Loads in EVERY session
```

```yaml
---
inclusion: auto
name: css-conventions
description: CSS standards
---
# Loads when request mentions CSS
```

```yaml
---
inclusion: manual
---
# Loads only when you use #filename
```

**Current Files:**

| File | Type | Use When |
|------|------|----------|
| `skinwalker-project.md` | always | Every session (project context) |
| `css-conventions.md` | auto | Working on styles |
| `audio-guide.md` | auto | Working on audio |
| `electron-conventions.md` | auto | Working on IPC/main process |
| `testing-guide.md` | manual | Running tests |
| `spec-template.md` | manual | Creating new spec |

**When to create:** When you have repeated patterns or important conventions

---

## 🪝 Hooks (Automation)

**What:** Actions triggered by events

**Types:**

```json
{
  "action": { "type": "agent", "prompt": "..." }
}
// Injects prompt into AI context
```

```json
{
  "action": { "type": "command", "command": "npm run test" }
}
// Runs shell command
```

**Triggers:**

| Trigger | Fires When |
|---------|------------|
| `SessionStart` | Session begins |
| `PostFileSave` | File saved (use matcher for file type) |
| `PostFileCreate` | File created |
| `PreToolUse` | Before tool runs (can block) |
| `PostToolUse` | After tool runs |

**Current Hooks:**

1. **remind-spec-first.json** (SessionStart → agent)
   - Reminds about spec-first, no absolute paths, read AGENTS.md

2. **typecheck-on-save.json** (PostFileSave .ts → command)
   - Runs `npm run typecheck` on every TypeScript save

**When to create:** Repetitive checks, validations, reminders

---

## 🔄 Workflows (Multi-Step Processes)

**What:** Automated sequences for common tasks

**Structure:**

```json
{
  "name": "workflow-name",
  "inputs": { "param": { "required": true } },
  "steps": [
    {
      "id": "step-1",
      "agent": "wf-coder",
      "prompt": "Do thing with {{param}}...",
      "captureOutput": "result1"
    },
    {
      "id": "step-2",
      "agent": "wf-coder",
      "prompt": "Use {{result1}} to...",
      "captureOutput": "result2"
    }
  ]
}
```

**Current Workflow:**

**new-skin-feature.workflow.json**
```
Input: skinName, featureName, description
Steps:
  1. Create spec
  2. Implement feature
  3. Test implementation
  4. Update spec with notes
  5. Update AGENTS.md
```

**When to use:** Multi-step repeatable processes

---

## How They Work Together

```
┌─────────────┐
│ You Request │
│   Feature   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│   Hook Fires    │──────│ SessionStart │
│  (Reminds AI)   │      │    Reminder  │
└────────┬────────┘      └──────────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────┐
│ Steering Loads   │─────│ CSS/Audio/   │
│ (Guides AI)      │     │ Electron     │
└────────┬─────────┘     └──────────────┘
         │
         ▼
┌──────────────────┐
│  Spec Created    │──── 📋 .kiro/specs/feature.md
│  (Design First)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────┐
│ Implementation   │─────│   Code       │
│ (Follow Patterns)│     │   Changes    │
└────────┬─────────┘     └──────────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────┐
│   Hook Fires     │─────│ PostFileSave │
│ (TypeCheck)      │     │  Validation  │
└────────┬─────────┘     └──────────────┘
         │
         ▼
┌──────────────────┐
│ Spec Updated     │──── ✅ Implementation Notes
│ (Document)       │
└──────────────────┘
```

---

## File Locations

```
.kiro/
├── specs/              # Feature specifications
│   ├── dracula-blood-effects.md
│   └── code-optimization.md
├── docs/               # Implementation summaries
│   ├── dependency-upgrade.md
│   └── workflow-improvements.md
├── steering/           # Development guides
│   ├── skinwalker-project.md (always)
│   ├── css-conventions.md (auto)
│   ├── audio-guide.md (auto)
│   ├── electron-conventions.md (auto)
│   ├── testing-guide.md (manual)
│   ├── spec-template.md (manual)
│   └── understanding-kiro.md (manual)
├── hooks/              # Automation
│   ├── remind-spec-first.json
│   └── typecheck-on-save.json
├── workflows/          # Multi-step processes
│   └── new-skin-feature.workflow.json
└── QUICK-REFERENCE.md  # This file
```

---

## Common Tasks

### Add a Feature
```
1. Create spec: .kiro/specs/feature-name.md
2. Implement: src/renderer/...
3. Hook validates: typecheck-on-save.json runs
4. Update spec: Mark complete, add notes
5. Update: docs/AGENTS.md with lessons
```

### Create Convention
```
1. Create: .kiro/steering/topic-guide.md
2. Add frontmatter: inclusion: auto/always/manual
3. Document: Patterns, rules, examples
4. Reference: In future work
```

### Automate Check
```
1. Create: .kiro/hooks/check-name.json
2. Choose trigger: SessionStart, PostFileSave, etc.
3. Choose action: agent (prompt) or command (shell)
4. Test: Verify it works
```

### Multi-Step Process
```
1. Create: .kiro/workflows/process-name.workflow.json
2. Define: inputs, steps with agents
3. Test: Run with real data
4. Use: Reference in future
```

---

## Kiroween Judging

**Judges look for:**

✅ Specs in `.kiro/specs/` (design before code)  
✅ `.kiro/` folder committed (not gitignored)  
✅ Steering files (AI guidance)  
✅ Hooks (automation)  
✅ Implementation notes (lessons learned)  

**What they DON'T want to see:**

❌ Empty `.kiro/` folder  
❌ Specs written after code  
❌ No evidence of methodology  
❌ Generic "I used AI" claims  

---

## Remember

- 📋 **Spec FIRST** — Always design before coding
- 🧭 **Follow steering** — Consistency matters
- 🪝 **Let hooks work** — Automation catches errors
- 🔄 **Use workflows** — Don't repeat yourself
- 📝 **Document lessons** — Update specs and AGENTS.md

**The `.kiro/` folder proves your professional AI-assisted development process.**
