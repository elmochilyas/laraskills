# Anti-Patterns: ADR Process for APIs

## AP-1: ADR Graveyard
**Category**: Governance

**Description**: Architecture Decision Records are written but nobody reads them. They accumulate in the repository as documentation artifacts without influencing design decisions. The process becomes a compliance checkbox rather than a communication tool.

**Warning Signs**:
- ADRs exist but are never referenced in PRs or discussions
- Team members cannot name the last 3 ADRs created
- ADR review is skipped or rubber-stamped
- Commit messages never reference ADR numbers
- New team members are unaware ADRs exist

**Harms**:
- ADR creation is wasted effort
- Design decisions lack documented rationale
- Repeated debates about previously settled decisions
- Organizational memory degrades as team members leave

**Real-World Consequence**: A team writes 40 ADRs over 2 years. A new architect proposes cursor-based pagination (decided in ADR-014, 18 months ago). The team spends 3 hours debating it until someone finds the ADR. Nobody had read it since it was written.

**Preferred Alternative**: Reference ADR numbers in commit messages and code comments. Review ADRs like code in PRs. Mention relevant ADRs in design discussions. Keep ADRs to 1-2 pages so they are actually read.

**Refactoring Strategy**: Add CI check that PR descriptions must reference ADR numbers when implementing ADR decisions, create a "recent ADRs" section in team wiki or README, mention ADRs in sprint demos when relevant features ship.

**Detection Checklist**:
- `[ ]` Are ADR numbers referenced in commit messages?
- `[ ]` Do team members read new ADRs when created?
- `[ ]` Are ADRs mentioned in design discussions?
- `[ ]` Can a new team member find relevant ADRs?

**Related**: 05-rules.md (Rule 4: Reference ADR Numbers in Commit Messages and Code Comments), 04-standardized-knowledge.md

---

## AP-2: Post-Hoc ADRs (Rationalization After Implementation)
**Category**: Architecture

**Description**: Writing ADRs after implementation is complete rather than during the design phase. The ADR becomes a historical record that retroactively rationalizes the chosen approach, losing the real tradeoff analysis and alternatives considered.

**Warning Signs**:
- ADR creation date is after implementation completion date
- ADR describes the implemented solution as the "obvious" choice
- No alternatives seriously evaluated — just one option presented
- "We already built it this way" appears in ADR justification
- ADR is created only when someone asks "why did we do this?"

**Harms**:
- Lost decision rationale and alternatives considered
- Post-hoc rationalization masks suboptimal decisions
- Team cannot learn from mistakes (rationale is rewritten)
- ADRs become documentation compliance, not decision tools

**Real-World Consequence**: A team implements offset pagination, then writes ADR-020 after deployment: "We chose offset pagination after evaluating cursor-based and keyset." In reality, the developer was most familiar with offset pagination and didn't evaluate alternatives. The misleading ADR influences future decisions.

**Preferred Alternative**: Write ADRs during the design phase, before implementation begins. The ADR should document the decision process — context, options evaluated, rationale, and consequences — while the decision is being made.

**Refactoring Strategy**: For new decisions, enforce ADR-before-implementation in the PR workflow (ADR PR must precede implementation PR). For existing post-hoc ADRs, add a note acknowledging the timing and invite retrospective evaluation.

**Detection Checklist**:
- `[ ]` Was the ADR written before or during design phase?
- `[ ]` Does the ADR evaluate multiple alternatives fairly?
- `[ ]` Can you identify the actual decision timing vs ADR creation timing?
- `[ ]` Would the decision change if written before implementation?

**Related**: 05-rules.md (Rule 2: Write ADRs Before or During Design Phase), 04-standardized-knowledge.md, 07-decision-trees.md

---

## AP-3: Novel-Length ADRs (Decision Scope Bloat)
**Category**: Maintainability

**Description**: Writing ADRs that span 5-15 pages covering multiple related decisions in a single document. Long ADRs are not read by team members, defeating the purpose of documenting decisions.

**Warning Signs**:
- ADR exceeds 2 pages
- Single ADR covers multiple decisions (pagination, auth, error format)
- ADR has subsections with independent decision points
- Team members say "I'll read it later" and never do
- ADR takes more than 30 minutes to review

**Harms**:
- ADRs go unread and uninfluential
- Cannot supersede individual decisions — must rewrite entire ADR
- Reviewers rubber-stamp without thorough reading
- Decision documentation becomes compliance exercise

**Real-World Consequence**: ADR-014 covers "API Design Decisions" across 12 pages including pagination strategy, authentication method, error format, naming conventions, and rate limiting. Pagination strategy needs changing 6 months later. The entire 12-page ADR must be superseded, losing all other decisions.

**Preferred Alternative**: One ADR per decision. If it exceeds 2 pages, split into multiple ADRs. Keep each ADR focused on a single architectural decision with clear context, options, rationale, and consequences.

**Refactoring Strategy**: Identify multi-decision ADRs, extract each decision into its own ADR with supersedes relationships, update references across the codebase, add CI check that warns if ADR exceeds 2 pages.

**Detection Checklist**:
- `[ ]` Is each ADR under 2 pages?
- `[ ]` Does each ADR cover exactly one decision?
- `[ ]` Can the ADR be superseded without affecting unrelated decisions?
- `[ ]` Do team members read new ADRs within a week?

**Related**: 05-rules.md (Rule 7: Keep ADRs to 1-2 Pages, Rule 1: Write One ADR Per Decision), 04-standardized-knowledge.md, 07-decision-trees.md

---

## AP-4: No-ADR Decisions
**Category**: Governance

**Description**: Significant API design decisions are made in chat messages, meetings, or hallway conversations without any ADR documenting the rationale. These decisions are invisible to future team members who must reconstruct or rediscover the reasoning.

**Warning Signs**:
- Design decisions documented only in Slack/Discord/Teams
- Meeting notes mention decisions but no ADR is created
- "Why did we do this?" questions arise in code review
- Same architectural debate happens multiple times
- New team members cannot find design rationale

**Harms**:
- Repeated debates about previously settled decisions
- Lost organizational memory when people leave
- Inconsistent decisions across different contexts
- No accountability for architectural choices

**Real-World Consequence**: Two senior engineers decide on cursor-based pagination in a Slack thread. Both leave the company within 6 months. A new team considers changing to offset pagination because nobody knows why cursor-based was chosen. They spend 2 days re-evaluating the same tradeoffs.

**Preferred Alternative**: Create an ADR for any significant API design decision — decisions with multiple viable alternatives, long-term impact on API surface, or choices future team members will need to understand. Document before or during design phase.

**Refactoring Strategy**: Create lightweight "ADR capture" habit — after any significant design discussion, the decision-maker creates a 1-page ADR. Add a step to Definition of Done: "Is this change related to a significant design decision that needs an ADR?"

**Detection Checklist**:
- `[ ]` Have any significant API decisions been made this month without ADRs?
- `[ ]` Are design decisions documented outside the repository?
- `[ ]` Can you find the rationale for each significant API design choice?
- `[ ]` Do new team members know to create ADRs?

**Related**: 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-5: ADR Status Stagnation
**Description**: ADRs are created with a status (e.g., "proposed" or "accepted") but the status is never updated when the decision changes, is superseded, or is deprecated. The ADR repository shows inaccurate decision state.

**Warning Signs**:
- ADRs show "proposed" status from years ago
- Superseded ADRs still show "accepted" status
- No process for updating ADR status
- Team cannot determine current decision state without reading every ADR

**Harms**:
- Team cannot trust ADR status at face value
- Incorrect decisions cited as current when they are actually superseded
- Compliance gaps when regulated decisions appear unresolved
- Wasted time reading irrelevant ADRs

**Real-World Consequence**: ADR-008 "Offset Pagination Strategy" shows "accepted" status but was actually superseded by ADR-014 "Cursor Pagination Strategy" 18 months ago. A new developer reads ADR-008 and implements offset pagination, wasting 3 days of work.

**Preferred Alternative**: Use YAML frontmatter with machine-readable status that is updated when decisions change. Include `superseded-by` field to link to replacing ADRs. Add CI check that verifies status validity.

**Refactoring Strategy**: Audit all ADRs for status accuracy, update frontmatter to reflect current state, add `superseded-by` links where applicable, implement automated validation of status transitions in CI.

**Detection Checklist**:
- `[ ]` Are all ADR statuses up to date?
- `[ ]` Do superseded ADRs link to their replacements?
- `[ ]` Is there a process for updating ADR status?
- `[ ]` Can tooling query current decision status?

**Related**: 05-rules.md (Rule 5: Never Delete Superseded ADRs, Rule 6: Use YAML Frontmatter for Machine-Readability), 04-standardized-knowledge.md, 06-skills.md

---

## AP-6: ADRs Not Reviewed Before Merging
**Category**: Process

**Description**: ADRs are committed directly to the main branch without peer review. One person makes a unilateral architectural decision without team input, missing tradeoffs and alternatives others would raise.

**Warning Signs**:
- ADR commits appear directly on main branch
- No PR comments or review history on ADRs
- Team discovers decisions after implementation
- ADRs represent personal opinion rather than team consensus

**Harms**:
- Missed tradeoffs and alternatives
- Decisions not socialized — team resistance after implementation
- ADR becomes personal preference, not team alignment
- Team feels excluded from architectural decisions

**Real-World Consequence**: A lead engineer commits ADR-022 "Switch to WebSocket API" directly to main. The team discovers the decision during sprint planning. Three developers have concerns about scalability that were never considered. The ADR is rewritten after a 4-hour debate.

**Preferred Alternative**: Submit ADRs as pull requests with mandatory review and approval before merging. Reviewers should examine tradeoffs, question assumptions, and verify alternatives were considered.

**Refactoring Strategy**: Add branch protection to docs/adr/ directory requiring PR review, create ADR review checklist, add ADR review to team workflow documentation, set expectation that ADR review is part of Definition of Done.

**Detection Checklist**:
- `[ ]` Are ADRs submitted as PRs with reviewers?
- `[ ]` Do ADR PRs receive comments and discussion?
- `[ ]` Has every team member reviewed at least one ADR recently?
- `[ ]` Is the ADR directory protected from direct commits?

**Related**: 05-rules.md (Rule 3: Review ADRs Like Code in PRs), 04-standardized-knowledge.md, 06-skills.md
