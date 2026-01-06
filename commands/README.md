# WYN - ClaudeCode Commands
## Quick Commands to Invoke Agents

> These commands encapsulate verbose prompts for consistent agent invocation.

---

## 1. AVAILABLE COMMANDS

| Command | Agent | Purpose |
|---------|-------|---------|
| `/plan-feature` | ARCHITECT | Plan a new feature |
| `/plan-fix` | ARCHITECT | Plan a bugfix |
| `/plan-refactor` | ARCHITECT | Plan refactoring |
| `/implement-be` | IMPLEMENTER_BE | Implement backend |
| `/implement-fe` | IMPLEMENTER_FE | Implement frontend |
| `/review` | REVIEWER | Review implementation |
| `/ops-deploy` | OPS | Deploy changes |
| `/ops-incident` | OPS | Handle incident |

---

## 2. WORKFLOW SEQUENCE

Standard feature implementation:

```
1. /plan-feature "wine deletion"
   └─► ARCHITECT creates plans/PLAN-XXX-feature-wine-deletion.md

2. /implement-be "PLAN-XXX"
   └─► IMPLEMENTER_BE builds API route

3. /implement-fe "PLAN-XXX"
   └─► IMPLEMENTER_FE builds UI component

4. /review "PLAN-XXX"
   └─► REVIEWER validates implementation

5. /ops-deploy "production"
   └─► OPS deploys to production
```

---

## 3. COMMAND DETAILS

### 3.1 Planning Commands

#### `/plan-feature <name>`

```
Usage: /plan-feature "feature name"

Example: /plan-feature "wine deletion with confirmation"

Output: plans/PLAN-XXX-feature-wine-deletion.md

The Architect will:
1. Analyze the request
2. Create a detailed implementation plan
3. Specify API contracts
4. Define test requirements
```

#### `/plan-fix <description>`

```
Usage: /plan-fix "bug description"

Example: /plan-fix "toggle doesn't persist to database"

Output: plans/PLAN-XXX-fix-toggle-persist.md

The Architect will:
1. Analyze the bug
2. Identify root cause
3. Plan the fix
4. Define regression tests
```

#### `/plan-refactor <area>`

```
Usage: /plan-refactor "area to refactor"

Example: /plan-refactor "extract LLM client to separate module"

Output: plans/PLAN-XXX-refactor-llm-client.md

The Architect will:
1. Analyze current code
2. Define refactoring approach
3. Ensure no behavior changes
4. Plan incremental steps
```

---

### 3.2 Implementation Commands

#### `/implement-be <plan>`

```
Usage: /implement-be "PLAN-XXX"

Example: /implement-be "PLAN-005"

The Backend Implementer will:
1. Read the approved plan
2. Implement API routes
3. Write lib functions
4. Create tests
5. Report completion

Files touched:
- app/api/**
- lib/**
- types/index.ts
```

#### `/implement-fe <plan>`

```
Usage: /implement-fe "PLAN-XXX"

Example: /implement-fe "PLAN-005"

The Frontend Implementer will:
1. Read the approved plan
2. Create components
3. Build pages
4. Handle states
5. Create tests

Files touched:
- app/**/*.tsx
- components/**
- hooks/**
```

#### `/implement-full <plan>`

```
Usage: /implement-full "PLAN-XXX"

For full-stack changes. Coordinates BE and FE implementation sequentially.
```

---

### 3.3 Review Commands

#### `/review <plan>`

```
Usage: /review "PLAN-XXX"

Example: /review "PLAN-005"

The Reviewer will:
1. Check plan compliance
2. Verify code quality
3. Check test coverage
4. Identify issues
5. Approve or request changes

Output: Review report with pass/fail status
```

#### `/review-diff`

```
Usage: /review-diff

Reviews the current git diff against relevant plans.
```

---

### 3.4 Operations Commands

#### `/ops-deploy <environment>`

```
Usage: /ops-deploy "preview" | "production"

Example: /ops-deploy "production"

The Ops agent will:
1. Run pre-deployment checks
2. Execute deployment
3. Verify success
4. Monitor for issues
```

#### `/ops-incident <description>`

```
Usage: /ops-incident "description"

Example: /ops-incident "500 errors on /api/chat"

The Ops agent will:
1. Assess severity
2. Check logs
3. Identify cause
4. Apply mitigation
5. Document incident
```

---

## 4. COMMAND TEMPLATES

Copy these for ClaudeCode sessions:

### Plan Feature

```
@claude Use agents/AGENT_ARCHITECT.md

Read CLAUDE.md for context, then create a detailed implementation plan for:

FEATURE: [description]

USER STORY:
As a [role], I want [capability] so that [benefit].

CONSTRAINTS:
- [constraint 1]
- [constraint 2]

Output a complete plan in plans/PLAN-XXX-feature-[name].md
```

### Implement Backend

```
@claude Use agents/AGENT_IMPLEMENTER_BE.md

Read CLAUDE.md and plans/PLAN-XXX.md, then implement:

1. API routes as specified
2. Lib functions needed
3. Update types if needed
4. Write tests

Follow existing patterns in the codebase.
```

### Implement Frontend

```
@claude Use agents/AGENT_IMPLEMENTER_FE.md

Read CLAUDE.md and plans/PLAN-XXX.md, then implement:

1. Components as specified
2. Pages if needed
3. Hooks if needed
4. Handle all states (loading, error, empty)

Follow existing patterns and ensure mobile responsiveness.
```

### Review

```
@claude Use agents/AGENT_REVIEWER.md

Read CLAUDE.md and plans/PLAN-XXX.md, then review:

FILES:
- [file1]
- [file2]

Check:
1. Plan compliance
2. Code quality
3. Test coverage
4. Breaking changes

Output a structured review report.
```

### Deploy

```
@claude Use agents/AGENT_OPS.md

Execute deployment to [environment]:

1. Pre-deployment checks
2. Deploy
3. Verify
4. Monitor

Report any issues.
```

---

## 5. SHORTCUTS (Shell Aliases)

Add to your `.bashrc` or `.zshrc`:

```bash
# WYN ClaudeCode shortcuts
alias wyn-plan='claude "Use agents/AGENT_ARCHITECT.md. Plan feature:"'
alias wyn-be='claude "Use agents/AGENT_IMPLEMENTER_BE.md. Implement:"'
alias wyn-fe='claude "Use agents/AGENT_IMPLEMENTER_FE.md. Implement:"'
alias wyn-review='claude "Use agents/AGENT_REVIEWER.md. Review:"'
alias wyn-deploy='claude "Use agents/AGENT_OPS.md. Deploy:"'

# Usage:
# wyn-plan "add wine deletion"
# wyn-be "PLAN-005"
# wyn-review "PLAN-005"
```

---

## 6. BEST PRACTICES

### Do

✅ Always start with a plan
✅ Reference plan IDs in commands
✅ Let agents complete before interrupting
✅ Review before deploying

### Don't

❌ Skip the planning phase
❌ Mix agent responsibilities
❌ Deploy without review
❌ Ignore agent warnings

---

## 7. TROUBLESHOOTING

### Agent not following conventions?

```
Remind it:
"Re-read CLAUDE.md and follow the patterns specified."
```

### Implementation deviating from plan?

```
Stop and ask:
"This seems to deviate from PLAN-XXX. Please clarify or update the plan first."
```

### Review too strict?

```
Discuss with Architect:
"REVIEWER flagged [issue]. Is this requirement correct in the plan?"
```

---

## 8. QUICK START

For a new feature:

```bash
# 1. Plan
claude "Use agents/AGENT_ARCHITECT.md. Read CLAUDE.md. Plan a feature for wine deletion with confirmation modal."

# 2. Wait for plan, then implement backend
claude "Use agents/AGENT_IMPLEMENTER_BE.md. Read CLAUDE.md and plans/PLAN-XXX.md. Implement the DELETE endpoint."

# 3. Implement frontend
claude "Use agents/AGENT_IMPLEMENTER_FE.md. Read CLAUDE.md and plans/PLAN-XXX.md. Implement the ConfirmModal and delete button."

# 4. Review
claude "Use agents/AGENT_REVIEWER.md. Read CLAUDE.md and plans/PLAN-XXX.md. Review the implementation."

# 5. Deploy
claude "Use agents/AGENT_OPS.md. Deploy to production."
```

---

**Commands make agents consistent. Consistency makes quality.**
