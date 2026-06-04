# Phase 5: Rules — ADR Process for APIs

## Rule 1: Write One ADR Per Decision
---
## Category
Maintainability
---
## Rule
Always create one ADR document per architectural decision. If the document exceeds 2 pages, split it into multiple ADRs. Never bundle multiple independent decisions into a single ADR.
---
## Reason
Single-decision ADRs remain focused, reviewable, and supersedable. Multi-decision ADRs cannot be partially superseded without rewriting the entire document.
---
## Bad Example
```markdown
# ADR-014: Pagination, Auth, and Error Format Decisions
# Three decisions in one document — cannot supersede just one
```
---
## Good Example
```markdown
# ADR-014: API Pagination Strategy
# ADR-015: Authentication Method Selection
# ADR-016: Error Response Format Standardization
```
---
## Exceptions
Trivial co-dependent decisions that are never superseded individually may be combined.
---
## Consequences Of Violation
Cannot supersede individual decisions; ADRs become unfocused and hard to review; organizational memory degrades.
---

## Rule 2: Write ADRs Before or During Design Phase
---
## Category
Architecture
---
## Rule
Always write ADRs during the design phase, before implementation begins. Never write ADRs after implementation is complete.
---
## Reason
ADRs written after implementation are historical records, not decision tools. They often rationalize decisions retroactively, losing the real tradeoff analysis.
---
## Bad Example
```markdown
# ADR-020 written 2 weeks after implementation
"After building the pagination system, we decided cursor-based was best."
```
---
## Good Example
```markdown
# ADR-020 written during design sprint
"After evaluating offset-based, cursor-based, and keyset pagination, we chose cursor-based because..."
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Lost decision rationale; repeated debates about why something was done a certain way; post-hoc rationalization.
---

## Rule 3: Review ADRs Like Code in PRs
---
## Category
Maintainability
---
## Rule
Always submit ADRs as pull requests with mandatory review and approval before merging. Never commit ADRs without peer review.
---
## Reason
ADRs capture significant architectural decisions. PR review ensures assumptions are challenged, tradeoffs are examined, and the decision is shared.
---
## Bad Example
```bash
# ADR committed directly to main — no review
git commit -m "Add ADR-014 pagination strategy"
```
---
## Good Example
```bash
# ADR PR with reviewers
gh pr create --title "ADR-014: Pagination Strategy" --reviewers @team
```
---
## Exceptions
Trivial decisions (already covered by existing precedent) may skip formal review.
---
## Consequences Of Violation
Decisions made unilaterally; missed tradeoffs; team not aligned; ADR becomes personal opinion rather than team consensus.
---

## Rule 4: Reference ADR Numbers in Commit Messages and Code Comments
---
## Category
Maintainability
---
## Rule
Always reference the relevant ADR number in commit messages and code comments when implementing a decision from an ADR. Never implement an ADR decision without tracing it back to the ADR.
---
## Reason
ADR references create traceability from code back to the decision, enabling new team members and future maintainers to understand why code is written a certain way.
---
## Bad Example
```bash
git commit -m "Implement cursor pagination"  # No ADR reference
```
---
## Good Example
```bash
git commit -m "Implement cursor pagination (ADR-014)"
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Future developers cannot find the rationale for code; ADRs become orphaned documents disconnected from implementation.
---

## Rule 5: Never Delete Superseded ADRs
---
## Category
Maintainability
---
## Rule
Always keep superseded ADRs in the repository. Never delete an ADR, even if it is superseded. Update its status to "superseded" and link to the replacing ADR.
---
## Reason
Superseded ADRs contain historical context — why a decision was made and why it changed. Deleting them loses organizational memory and makes future decisions harder.
---
## Bad Example
```bash
# Deleted the old ADR — no trace of previous decision
git rm docs/adr/0008-offset-pagination.md
```
---
## Good Example
```markdown
# ADR-014: Cursor Pagination Strategy
status: superseded
superseded-by: ADR-022
---
# ADR-014 remains in repo for historical context
```
---
## Exceptions
ADRs containing sensitive information (credentials, vulnerability details) may be redacted or removed.
---
## Consequences Of Violation
Lost decision history; repeated mistakes ("why did we move away from this?"); organizational amnesia.
---

## Rule 6: Use YAML Frontmatter for Machine-Readability
---
## Category
Maintainability
---
## Rule
Always include YAML frontmatter (status, date, supersedes, superseded-by, affects) in every ADR. Never write ADRs without structured metadata.
---
## Reason
Structured frontmatter enables automated tooling — search, status tracking, impact analysis, and report generation.
---
## Bad Example
```markdown
# ADR-014: Pagination Strategy
# No frontmatter — cannot be parsed by tooling
```
---
## Good Example
```markdown
---
status: accepted
date: 2026-06-02
supersedes: 0008
affects: GET /users, GET /orders
---
# ADR-014: Pagination Strategy
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Manual tracking of ADR status; no automation possible; status drift unnoticed.
---

## Rule 7: Keep ADRs to 1-2 Pages
---
## Category
Maintainability
---
## Rule
Always keep individual ADRs concise — 1 to 2 pages maximum. If more space is needed, the decision scope is too broad and should be split.
---
## Reason
Long ADRs are not read. The 2-page limit forces crisp articulation of the decision context, options, rationale, and consequences.
---
## Bad Example
```markdown
# ADR-014: Everything About API Design
# 15 pages covering pagination, auth, errors, naming, and versioning
```
---
## Good Example
```markdown
# ADR-014: Pagination Strategy
# 1.5 pages — context, 3 options evaluated, chosen option, consequences
```
---
## Exceptions
Exceptionally complex decisions (multi-service auth architecture) may extend to 3 pages with executive summary on page 1.
---
## Consequences Of Violation
ADRs go unread; decisions are not socialized; the ADR process becomes a compliance exercise rather than a communication tool.
