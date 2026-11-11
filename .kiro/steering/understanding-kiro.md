---
inclusion: manual
name: understanding-kiro
description: Complete guide to Kiro concepts - specs, steering, hooks, and workflows
---

# Understanding Kiro Concepts

This guide explains the Kiro AI development system and how to use it effectively in the Skinwalker project.

## What is Kiro?

**Kiro** is an AI-powered development environment (IDE) where an AI agent (me!) helps you build software. Unlike just asking an AI questions, Kiro provides:

- **Structured workflows** — Multi-step processes with clear phases
- **Steering files** — Guidance that shapes how I work
- **Hooks** — Automation triggered by events
- **Specs** — Feature documentation created before coding

Think of it as: **"GitHub Copilot" + "Project Manager" + "Documentation System"** in one.

---

## Core Concepts

### 1. 📋 Specs (Specifications)

**Location:** `.kiro/specs/`

#### What Are Specs?

Specs are **feature design documents** created BEFORE implementing code. They answer:
- **What** are we building?
- **Why** are we building it?
- **How** will it work?
- **When** is it done? (acceptance criteria)

#### Why Use Specs?

1. **Kiroween Requirement** — Contest rules require spec-first development
2. **Clear Planning** — Think through design before coding
3. **Audit Trail** — Judges can see your thought process
4. **Avoid Rework** — Catch problems in planning, not in code

#### Spec Structure

Every spec has these sections:

```markdown
# [Feature Name] Specification

**Status:** Draft | In Progress | Complete
**Created:** YYYY-MM-DD
**Owner:** Who requested this
**Implementation:** Who will build it

## Overview
2-3 sentences: what is this and why does it exist?

## Requirements
### Functional Requirements
- [ ] User can do X
- [ ] System must handle Y

### Technical Requirements
- [ ] Must integrate with Z API
- [ ] Must use existing pattern from file.ts

### Non-Functional Requirements
- [ ] Performance: Must load in < 2 seconds
- [ ] Compatibility: Works on Windows 10+

## Design Approach
### Architecture
How does this fit into existing code?

### Key Components
List files that will change and their roles

### Data Flow
How does data move through the system?

## Implementation Tasks
### Phase 1: Foundation
- [ ] Task 1
- [ ] Task 2

### Phase 2: Core Feature
- [ ] Task 3

## Acceptance Criteria
Must ALL pass before marking complete:
- [ ] Feature works as described
- [ ] TypeScript compiles
- [ ] Tests pass

## Open Questions
- [ ] Question 1 — needs decision

## Risks & Mitigations
- **Risk:** What could go wrong
  - **Mitigation:** How to prevent

## Implementation Notes (Fill After Building)
### What Changed
Differences from original design

### Lessons Learned
Problems encountered, solutions found
```

#### When to Create a Spec

**Always:**
- New skins or skin features
- New player controls
- IPC bridge additions
- Major refactorings

**Optional (but recommended):**
- Bug fixes requiring design decisions
- Performance optimizations with tradeoffs

**Not Needed:**
- Typo fixes
- Formatting changes
- Documentation updates

#### Example: Blood Effects Spec

See `.kiro/specs/dracula-blood-effects.md` for a complete example showing:
- Requirements (101+ blood elements, animations)
- Design approach (procedural generation + CSS)
- Implementation tasks (3 phases)
- Acceptance criteria (60 FPS, no pointer blocking)
- Lessons learned (glow on dark backgrounds)

---

### 2. 🧭 Steering Files

**Location:** `.kiro/steering/`

#### What Are Steering Files?

Steering files are **guides and conventions** that influence how I (the AI) work. They're like:
- A style guide for code
- A reference manual for patterns
- A "best practices" document
- Context that helps me make better decisions

#### How Steering Works

When you work with me, steering files get loaded into my context. I read them and apply their guidance. Think of it like:

**Without steering:**
```
You: "Add a blood effect to the seekbar"
AI: *makes up a random approach*
```

**With steering (`css-conventions.md`):**
```
You: "Add a blood effect to the seekbar"
AI: *reads css-conventions.md*
AI: *follows established patterns*
    - Uses .dr- prefix (Dracula skin)
    - Positions with percentages
    - Animates with CSS keyframes
    - Adds CSS custom properties
```

#### Types of Steering Inclusion

Steering files have a **frontmatter** that controls when they load:

```markdown
---
inclusion: always
---
# This file loads in EVERY session
```

```markdown
---
inclusion: manual
---
# Loads only when you reference it with #
```

```markdown
---
inclusion: auto
name: css-conventions
description: CSS coding standards for Skinwalker skins
---
# Loads automatically when the request mentions CSS/styling
```

#### Current Steering Files

| File | Type | Purpose |
|------|------|---------|
| `skinwalker-project.md` | `always` | Core project context, rules, scope |
| `spec-template.md` | `manual` | Template for creating new specs |
| `css-conventions.md` | `auto` | CSS naming, patterns, animations |
| `audio-guide.md` | `auto` | Web Audio API patterns |
| `electron-conventions.md` | `auto` | IPC patterns, security rules |
| `testing-guide.md` | `manual` | Testing procedures |

#### When to Create Steering

Create a steering file when you have:
- **Repeated patterns** — "We always do X like this"
- **Important conventions** — "Never do Y"
- **Complex processes** — "Here's how to test feature Z"
- **Project-specific knowledge** — "Our audio engine works differently because..."

#### Example: Why css-conventions.md Exists

Before the steering file, every time you asked for a CSS change, I might:
- Use different naming (`.dracula-element` vs `.dr-element`)
- Position inconsistently (pixels vs percentages)
- Animate differently (JS loops vs CSS keyframes)

After creating `css-conventions.md`, I:
- ✅ Always use `.dr-` prefix for Dracula
- ✅ Always position with percentages for scaling
- ✅ Always use CSS animations (GPU-accelerated)
- ✅ Always follow z-index hierarchy

**Result:** Consistent, maintainable code

---

### 3. 🪝 Hooks

**Location:** `.kiro/hooks/`

#### What Are Hooks?

Hooks are **automated actions** that run when specific events happen. Like Git hooks, but for the development process.

#### Hook Types

**Agent Hooks** — Inject a prompt into my context
```json
{
  "trigger": "SessionStart",
  "action": {
    "type": "agent",
    "prompt": "Remember to create specs first!"
  }
}
```

**Command Hooks** — Run a shell command
```json
{
  "trigger": "PostFileSave",
  "matcher": "\\.ts$",
  "action": {
    "type": "command",
    "command": "npm run typecheck"
  }
}
```

#### Available Triggers

| Trigger | When It Fires |
|---------|---------------|
| `SessionStart` | When you start a new session |
| `UserPromptSubmit` | After you send a message |
| `PostFileSave` | After a file is saved |
| `PostFileCreate` | After a file is created |
| `PostFileDelete` | After a file is deleted |
| `PreToolUse` | Before I use a tool (can block) |
| `PostToolUse` | After I use a tool |
| `Stop` | When execution completes |

#### Current Hooks

**1. Session Start Reminder** (`remind-spec-first.json`)
```
When: Every new session starts
Does: Reminds me about:
      - Spec-first development
      - No absolute paths rule
      - Reading AGENTS.md first
```

**2. TypeCheck on Save** (`typecheck-on-save.json`)
```
When: Any .ts file is saved
Does: Runs npm run typecheck
Why:  Catches TypeScript errors immediately
```

#### When to Create Hooks

Create a hook when you want:
- **Automatic reminders** — "Always do X at start"
- **Validation** — "Check Y after every change"
- **Workflow enforcement** — "Block Z until W is done"
- **Convenience** — "Auto-run command on event"

#### Hook Exit Codes (for Commands)

```bash
exit 0  # Success
exit 2  # Block the action (for PreToolUse)
other   # Silent failure, no block
```

#### Example: Why typecheck-on-save Exists

**Before:**
```
1. Make changes to TypeScript file
2. Save
3. Continue working
4. Later: npm run build
5. ❌ ERROR: Type error from step 1!
6. Go back and fix
```

**After:**
```
1. Make changes to TypeScript file
2. Save → Hook runs typecheck automatically
3. ✅ See error immediately
4. Fix right away
```

**Result:** Catch errors earlier, waste less time

---

### 4. 🔄 Workflows

**Location:** `.kiro/workflows/`

#### What Are Workflows?

Workflows are **multi-step processes** that automate common development tasks. Like GitHub Actions, but for development instead of CI/CD.

#### Workflow Structure

```json
{
  "name": "new-skin-feature",
  "description": "Add a feature to a skin",
  "inputs": {
    "skinName": { "required": true },
    "featureName": { "required": true }
  },
  "steps": [
    {
      "id": "create-spec",
      "agent": "wf-coder",
      "prompt": "Create spec for {{featureName}}..."
    },
    {
      "id": "implement",
      "agent": "wf-coder",
      "prompt": "Implement the feature..."
    },
    {
      "id": "test",
      "agent": "wf-coder",
      "prompt": "Test and verify..."
    }
  ]
}
```

#### Current Workflow

**new-skin-feature** — Complete feature development cycle
```
Step 1: Create specification
Step 2: Implement feature
Step 3: Test implementation
Step 4: Update spec with notes
Step 5: Update AGENTS.md if needed
```

#### When to Use Workflows

Use a workflow when you have a **repeatable, multi-step process**:
- Adding features to skins
- Bug fix cycle (reproduce → fix → verify → document)
- Release process (test → build → package → publish)

**Don't use workflows for:**
- One-off tasks
- Simple single-step actions
- Exploratory work

---

## How They Work Together

### Real-World Example: Adding Blood Effects

Let's walk through how all Kiro concepts worked together for the blood effects feature:

#### 1. Session Starts
**Hook fires:** `remind-spec-first.json`
```
🪝 Hook says: "Remember: Create spec before implementing!"
```

#### 2. You Request Feature
```
You: "Add more blood effects to the seekbar"
```

#### 3. Steering Activates
```
🧭 Auto-loads: css-conventions.md (because request mentions CSS)
🧭 Always loaded: skinwalker-project.md (project context)
```

#### 4. I Create Spec
```
📋 Create: .kiro/specs/dracula-blood-effects.md
   - Requirements: 101+ blood elements
   - Design: Procedural generation + CSS
   - Tasks: 3 phases
   - Acceptance: 60 FPS, no pointer blocking
```

#### 5. I Implement
```
💻 Modify: src/renderer/skins/DraculaSkin.ts
💻 Modify: src/renderer/style.css
   - Follow css-conventions.md patterns
   - Use .dr- prefix
   - CSS animations (GPU-accelerated)
```

#### 6. Hook Validates
**Hook fires:** `typecheck-on-save.json` after each save
```
🪝 Runs: npm run typecheck
✅ Result: 0 errors
```

#### 7. I Test & Document
```
✅ Test: All acceptance criteria pass
📋 Update spec: Mark "Complete", add lessons learned
📝 Update: docs/AGENTS.md with new lesson
```

#### Result
- ✅ Spec created BEFORE code (Kiroween requirement)
- ✅ Code follows conventions (steering guidance)
- ✅ Type-safe (hook caught errors immediately)
- ✅ Documented (spec has implementation notes)
- ✅ Lessons captured (in AGENTS.md)

---

## Best Practices

### For Specs

✅ **DO:**
- Create spec BEFORE coding (Kiroween requirement)
- Use the template from `spec-template.md`
- Fill in "Implementation Notes" after building
- Mark status: Draft → In Progress → Complete

❌ **DON'T:**
- Write spec after coding (defeats the purpose)
- Skip acceptance criteria
- Leave open questions unanswered
- Forget to update AGENTS.md with lessons

### For Steering

✅ **DO:**
- Use `always` for core project context
- Use `auto` for topic-specific guides
- Use `manual` for templates and references
- Keep steering files focused (one topic each)

❌ **DON'T:**
- Put everything in one giant file
- Include code examples that will change
- Make steering files too generic
- Forget frontmatter (inclusion type)

### For Hooks

✅ **DO:**
- Use hooks for repetitive checks
- Use agent hooks for reminders
- Use command hooks for validation
- Test hooks before committing

❌ **DON'T:**
- Create too many hooks (overhead)
- Use hooks for one-off tasks
- Block critical actions unnecessarily
- Forget to handle exit codes

### For Workflows

✅ **DO:**
- Use for multi-step processes
- Make steps independent where possible
- Capture output for later steps
- Document the workflow purpose

❌ **DON'T:**
- Use for simple single-step tasks
- Make steps depend on manual input
- Create workflows for rare tasks
- Skip input validation

---

## Kiroween-Specific Requirements

For the Kiroween 2026 contest, judges look for:

### Required
- ✅ **Specs in `.kiro/specs/`** — Feature design BEFORE code
- ✅ **`.kiro/` folder committed** — Not gitignored
- ✅ **Honest Kiro usage** — Steering/hooks/specs show real process

### Encouraged
- 🌟 **Steering files** — Show you structured the AI's work
- 🌟 **Hooks** — Show automation and best practices
- 🌟 **Workflows** — Show repeatable processes
- 🌟 **Implementation notes** — Show lessons learned

### Judging Criteria
Judges want to see:
1. **Spec-first evidence** — Specs committed before implementation
2. **AI methodology** — How you used Kiro (not just "I used AI")
3. **Professional habits** — Testing, documentation, conventions
4. **Learning captured** — Lessons in specs and AGENTS.md

---

## Quick Reference

### "I want to..."

**...add a new feature**
1. Create spec in `.kiro/specs/`
2. Reference relevant steering (css, audio, electron)
3. Implement following conventions
4. Update spec with notes
5. Update AGENTS.md with lessons

**...enforce a coding standard**
1. Create steering file in `.kiro/steering/`
2. Add frontmatter (inclusion type)
3. Document patterns and rules
4. Reference in future work

**...automate a check**
1. Create hook in `.kiro/hooks/`
2. Choose trigger (SessionStart, PostFileSave, etc.)
3. Choose action (agent or command)
4. Test and commit

**...create a reusable process**
1. Create workflow in `.kiro/workflows/`
2. Define inputs and steps
3. Test with real data
4. Document usage

---

## Summary

**Kiro is a development system with four key concepts:**

1. **📋 Specs** — Design features BEFORE coding
2. **🧭 Steering** — Guide AI behavior with conventions
3. **🪝 Hooks** — Automate checks and reminders
4. **🔄 Workflows** — Multi-step reusable processes

**Together they provide:**
- ✅ Structure (specs → implement → document)
- ✅ Consistency (steering guides all work)
- ✅ Quality (hooks catch errors early)
- ✅ Efficiency (workflows automate repetition)

**For Skinwalker specifically:**
- Specs show Kiroween judges your methodology
- Steering keeps 3 skins consistent
- Hooks catch TypeScript errors immediately
- Workflows standardize feature development

**The `.kiro/` folder is your development infrastructure** — it's as important as your source code for a professional, well-managed project.
