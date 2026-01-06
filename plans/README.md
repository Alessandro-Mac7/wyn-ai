# WYN - Planning Documentation
## How to Write and Execute Change Plans

> **RULE:** No implementation without an approved plan.

---

## 1. THE MANDATORY WORKFLOW

Every change follows this sequence:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EXPLORE → PLAN → IMPLEMENT → REVIEW              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │ EXPLORE  │───►│   PLAN   │───►│IMPLEMENT │───►│  REVIEW  │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
│       │               │               │               │             │
│       ▼               ▼               ▼               ▼             │
│  Understand       Write plan      Code it         Validate         │
│  the problem      in this dir     (BE/FE)         vs plan          │
│                                                                      │
│  WHO: Anyone      WHO: Architect  WHO: Impl.      WHO: Reviewer    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.1 EXPLORE Phase

**Purpose:** Understand the problem before solving it.

**Activities:**
- Read existing code
- Identify affected files
- Understand current behavior
- Clarify requirements
- Ask questions

**Output:** Clear problem statement, no ambiguity

### 1.2 PLAN Phase

**Purpose:** Design the solution before coding.

**Activities:**
- Create plan file in `plans/`
- Define scope and goals
- List affected files
- Specify API changes
- Define test strategy

**Output:** Approved plan document

### 1.3 IMPLEMENT Phase

**Purpose:** Code the solution following the plan.

**Activities:**
- Write code as specified
- Write tests
- Follow conventions in `CLAUDE.md`
- Commit with proper messages

**Output:** Working code matching the plan

### 1.4 REVIEW Phase

**Purpose:** Validate implementation against plan.

**Activities:**
- Check plan compliance
- Verify test coverage
- Check for regressions
- Validate API contracts

**Output:** Approval or revision requests

---

## 2. PLAN FILE FORMAT

### 2.1 File Naming

```
plans/
├── PLAN-001-feature-chat-voice.md
├── PLAN-002-fix-wine-toggle.md
├── PLAN-003-refactor-llm-client.md
└── README.md (this file)
```

**Pattern:** `PLAN-{ID}-{type}-{short-description}.md`

### 2.2 Required Sections

Every plan MUST include:

```markdown
# PLAN-XXX: [Title]

## Status
- [ ] Draft
- [ ] Under Review
- [ ] Approved
- [ ] In Progress
- [ ] Completed

## Metadata
| Field | Value |
|-------|-------|
| Author | [Agent/Person] |
| Created | YYYY-MM-DD |
| Type | feature / fix / refactor |
| Priority | P0 / P1 / P2 |

## 1. Summary
[One paragraph explaining the change]

## 2. Goals
- Goal 1
- Goal 2

## 3. Non-Goals
- What this does NOT do

## 4. Affected Areas
| Area | Impact |
|------|--------|
| File/Module | Description of change |

## 5. Technical Design

### 5.1 API Changes
[New/modified endpoints, request/response formats]

### 5.2 Database Changes
[Schema changes, migrations]

### 5.3 Component Changes
[New/modified components]

### 5.4 Flow Diagram
[ASCII diagram or description]

## 6. Test Strategy
- Unit tests for [X]
- Integration tests for [Y]
- Manual testing: [steps]

## 7. Rollback Plan
[How to revert if something goes wrong]

## 8. Implementation Steps
1. [ ] Step 1
2. [ ] Step 2
3. [ ] Step 3

## 9. Review Checklist
- [ ] Plan reviewed by Architect
- [ ] Implementation matches plan
- [ ] Tests written and passing
- [ ] No breaking changes
```

---

## 3. PLAN TEMPLATES

### 3.1 Feature Template

```markdown
# PLAN-XXX: [Feature Name]

## Status
- [x] Draft
- [ ] Approved

## Metadata
| Field | Value |
|-------|-------|
| Author | AGENT_ARCHITECT |
| Created | YYYY-MM-DD |
| Type | feature |
| Priority | P1 |

## 1. Summary
Add [feature] to enable [user capability].

## 2. Goals
- Users can [do X]
- System supports [Y]

## 3. Non-Goals
- Not building [Z] in this iteration

## 4. Affected Areas
| Area | Impact |
|------|--------|
| `app/api/new-endpoint/` | New API route |
| `components/new/` | New UI component |
| `lib/feature.ts` | New utility functions |
| `types/index.ts` | New interfaces |

## 5. Technical Design

### 5.1 API Changes

**New Endpoint: POST /api/feature**

Request:
```json
{
  "field1": "string",
  "field2": number
}
```

Response:
```json
{
  "id": "uuid",
  "result": "string"
}
```

### 5.2 Database Changes
```sql
ALTER TABLE x ADD COLUMN y TEXT;
```

### 5.3 Component Changes
- `FeatureComponent.tsx`: Main component
- `FeatureModal.tsx`: Modal for input

## 6. Test Strategy
- Unit: `lib/feature.test.ts`
- Component: `FeatureComponent.test.tsx`
- E2E: Happy path in Playwright

## 7. Rollback Plan
1. Revert commit
2. Drop new column: `ALTER TABLE x DROP COLUMN y;`

## 8. Implementation Steps
1. [ ] Add types
2. [ ] Create lib function
3. [ ] Create API route
4. [ ] Create component
5. [ ] Write tests
6. [ ] Manual testing
```

### 3.2 Bugfix Template

```markdown
# PLAN-XXX: Fix [Bug Description]

## Status
- [x] Draft

## Metadata
| Field | Value |
|-------|-------|
| Author | AGENT_ARCHITECT |
| Type | fix |
| Priority | P0 |

## 1. Problem Statement
[Describe the bug: what happens vs what should happen]

## 2. Root Cause
[Analysis of why it happens]

## 3. Solution
[How to fix it]

## 4. Affected Areas
| File | Change |
|------|--------|
| `path/to/file.ts` | Fix X |

## 5. Test Strategy
- Add regression test for this bug
- Test: [specific scenario]

## 6. Verification
- [ ] Bug no longer reproducible
- [ ] No side effects
- [ ] Regression test added

## 7. Implementation Steps
1. [ ] Add failing test
2. [ ] Fix code
3. [ ] Verify test passes
```

### 3.3 Refactoring Template

```markdown
# PLAN-XXX: Refactor [Component/Module]

## Status
- [x] Draft

## Metadata
| Field | Value |
|-------|-------|
| Author | AGENT_ARCHITECT |
| Type | refactor |
| Priority | P2 |

## 1. Motivation
[Why this refactoring is needed]

## 2. Goals
- Improve [X]
- Enable [Y]
- Reduce [Z]

## 3. Approach
[How to refactor without breaking functionality]

## 4. Affected Areas
| Before | After |
|--------|-------|
| `old/path.ts` | `new/path.ts` |

## 5. Invariants
[What must NOT change in behavior]

## 6. Test Strategy
- Existing tests must pass
- Add tests for [gap]

## 7. Implementation Steps
1. [ ] Add tests for current behavior
2. [ ] Refactor incrementally
3. [ ] Verify tests still pass
```

---

## 4. PLAN REVIEW CRITERIA

A plan is **APPROVED** when:

- [ ] Problem is clearly stated
- [ ] Goals are measurable
- [ ] All affected areas identified
- [ ] API changes documented
- [ ] Database changes (if any) reversible
- [ ] Test strategy defined
- [ ] Rollback plan exists
- [ ] No architectural violations

A plan is **REJECTED** if:

- Scope is unclear
- Missing affected areas
- No test strategy
- Breaks existing contracts without migration
- Violates `CLAUDE.md` principles

---

## 5. EXAMPLE PLANS

### 5.1 Example: Add Wine Deletion

```markdown
# PLAN-005: Add Wine Deletion Feature

## Status
- [x] Approved

## Metadata
| Field | Value |
|-------|-------|
| Author | AGENT_ARCHITECT |
| Created | 2024-12-30 |
| Type | feature |
| Priority | P1 |

## 1. Summary
Enable restaurant admins to delete wines from their list with confirmation.

## 2. Goals
- Admin can delete wine from dashboard
- Confirmation modal prevents accidents
- Deleted wines removed from recommendations

## 3. Non-Goals
- Soft delete (wines are hard deleted)
- Bulk delete (one at a time)

## 4. Affected Areas
| Area | Impact |
|------|--------|
| `app/api/admin/wines/route.ts` | Add DELETE handler |
| `components/admin/WineCard.tsx` | Add delete button |
| `components/admin/ConfirmModal.tsx` | New component |
| `app/admin/dashboard/page.tsx` | Handle delete callback |

## 5. Technical Design

### 5.1 API Changes

**DELETE /api/admin/wines**

Request:
```json
{ "wineId": "uuid" }
```

Response (200):
```json
{ "deleted": true }
```

Response (404):
```json
{ "error": "Wine not found" }
```

### 5.2 Database Changes
None - uses existing DELETE on wines table.

### 5.3 Component Changes
- Add `ConfirmModal` with yes/no buttons
- Add trash icon to `WineCard`

## 6. Test Strategy
- Unit: DELETE handler returns correct status
- Component: ConfirmModal shows/hides correctly
- E2E: Delete wine and verify not in list

## 7. Rollback Plan
1. Revert commit
2. Data loss is acceptable (user-initiated deletion)

## 8. Implementation Steps
1. [x] Create ConfirmModal component
2. [x] Add DELETE handler to API
3. [x] Add delete button to WineCard
4. [x] Integrate modal in dashboard
5. [x] Write tests
```

---

## 6. WORKFLOW COMMANDS

Use these commands to manage plans:

```bash
# List all plans
ls plans/

# Create new plan (use template)
cp plans/TEMPLATE-feature.md plans/PLAN-XXX-feature-name.md

# View plan status
grep "Status" plans/PLAN-*.md

# Find approved plans
grep -l "Approved" plans/PLAN-*.md
```

---

## 7. AGENT RESPONSIBILITIES

| Phase | Primary Agent | Supporting Agents |
|-------|--------------|-------------------|
| EXPLORE | Any | - |
| PLAN | AGENT_ARCHITECT | - |
| IMPLEMENT | AGENT_IMPLEMENTER_* | AGENT_ARCHITECT (consult) |
| REVIEW | AGENT_REVIEWER | AGENT_ARCHITECT (verify) |
| DEPLOY | AGENT_OPS | AGENT_REVIEWER (approve) |

---

## 8. FAQ

**Q: Can I skip the plan for small changes?**
A: For typos/comments, yes. For ANY logic change, no.

**Q: Who approves plans?**
A: AGENT_ARCHITECT or project lead.

**Q: What if requirements change mid-implementation?**
A: Stop, update plan, get re-approval, then continue.

**Q: How detailed should plans be?**
A: Detailed enough that another agent can implement without questions.

---

**Remember: A good plan saves hours of rework.**
