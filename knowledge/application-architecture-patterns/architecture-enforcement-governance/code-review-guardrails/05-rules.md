# Rule: Automate Every Enforceable Rule Before Relying On Code Review
---
## Category
Architecture | Maintainability
---
## Rule
Default to automated enforcement (architecture tests, static analysis, linters) for every architectural rule that can be automated. Reserve code review exclusively for non-automatable concerns.
---
## Reason
Automated enforcement is faster, more reliable, and never forgets. Code review is expensive human time. Wasting review bandwidth on checks a machine could do reduces attention for the design-level issues that only humans can catch.
---
## Bad Example
Code review checklist includes "check that all services are in the Services namespace" — an automated rule that a 3-line Pest test can enforce.
---
## Good Example
```markdown
## PR Template — Architecture Section
- [ ] Are imports respecting bounded context boundaries? (Enforced by Pest tests)
- [ ] Is this the right abstraction level for this concern? (Human review — cannot automate)
- [ ] Does this change introduce unnecessary coupling? (Human review)
```
---
## Exceptions
Experimental rules that may be removed soon. Automate once the rule is stable.
---
## Consequences Of Violation
Reviewer time is wasted on trivial checks. Design-quality violations slip through because reviewers are fatigued by mechanical checks.

---
# Rule: Apply Architecture-First Review Order
---
## Category
Architecture
---
## Rule
Always evaluate the architectural impact of a pull request before reading the implementation details. If the architecture is wrong, reject the PR early.
---
## Reason
Reviewing implementation details first creates an anchoring bias. After spending 30 minutes reading code, a reviewer is less likely to suggest fundamental architectural changes. Architecture-first review identifies fatal design issues immediately.
---
## Bad Example
A reviewer reads through 500 lines of implementation, leaves comments on variable naming and test coverage, but does not notice that the code introduces a circular dependency between two bounded contexts.
---
## Good Example
```
1. Read PR title and description (2 min) — understand the architectural intent.
2. Read diff at file-structure level (3 min) — identify which contexts, layers, and namespaces are touched.
3. Evaluate architectural impact (5 min) — does this violate any documented rule or introduce new coupling?
4. Only then read implementation details.
```
---
## Exceptions
Trivial PRs (single-line changes, dependency updates) where architecture review is unnecessary.
---
## Consequences Of Violation
Fundamental architectural issues are not caught until after implementation review. Significant rework is required. The reviewer is less likely to raise architectural concerns after investing time in implementation review.

---
# Rule: Use Architecture Checklists Per Change Type In PR Templates
---
## Category
Architecture | Maintainability
---
## Rule
Include architecture checklist sections in PR templates with items specific to the change type (new module, cross-context change, refactoring, bug fix).
---
## Reason
A generic checklist is too vague to be useful. Targeted checklists ensure that reviewers consistently check the right concerns for each change type. A cross-context change needs different checks than a bug fix.
---
## Bad Example
The pull request template has a single checkbox: "Architecture rules are followed." It provides no guidance on what to check.
---
## Good Example
```markdown
### Architecture Checklist — Cross-Context Change
- [ ] New imports respect the dependency map
- [ ] No transitive dependencies introduced
- [ ] Context boundaries are maintained
- [ ] Shared kernel is not polluted with context-specific code

### Architecture Checklist — New Module
- [ ] Module follows the bounded context structure
- [ ] Service layer exists and is separate from controllers
- [ ] Repository interface exists in Contracts
```
---
## Exceptions
PRs that are purely cosmetic (whitespace, comments, documentation-only).
---
## Consequences Of Violation
Inconsistent review coverage. Each reviewer checks different things. Important architectural concerns are missed.

---
# Rule: Document Architecture Decisions From Code Review As ADRs
---
## Category
Architecture | Maintainability
---
## Rule
When a code review results in an architectural decision or change, always document the outcome as an Architecture Decision Record (ADR) rather than leaving it implicit in the PR discussion.
---
## Reason
PR discussions are ephemeral. Months later, no one remembers why a certain architectural decision was made during review. An ADR creates a permanent record that prevents recurring debates about the same decision.
---
## Bad Example
During review, a senior developer advises "use an Action class instead of putting this logic in the controller." The change is made but no record exists. Three months later, another developer puts similar logic in a controller and the debate starts over.
---
## Good Example
```
PR merged with a new ADR: docs/adr/0014-use-action-classes-for-order-processing.md
The ADR documents: why an action class was chosen over a controller method,
what alternatives were considered, and when this pattern should be used.
```
---
## Exceptions
Minor or obvious decisions that the team has already documented (e.g., "put this in a service, not a controller" is already in conventions).
---
## Consequences Of Violation
Recurring debates about the same architectural decisions. Loss of institutional knowledge when reviewers leave the team.

---
# Rule: Define An Escalation Path For Uncertain Architectural Violations
---
## Category
Architecture | Reliability
---
## Rule
Always define and document an escalation path for when a reviewer identifies a potential architectural violation but is uncertain about the severity or the correct resolution.
---
## Reason
Without an escalation path, uncertain reviewers either block the PR unnecessarily (over-escalation) or let the violation pass (under-escalation). A defined path ensures consistent handling of edge cases.
---
## Bad Example
A junior reviewer sees an import that might violate context isolation but is unsure. They approve the PR anyway because "it's probably fine." The import introduces a hidden coupling.
---
## Good Example
```markdown
## Escalation Path
1. Tag the PR with `needs-arch-review`
2. Add `@arch-review-team` as reviewer
3. If uncertain within 24h, escalate to the architecture lead
4. Decision is documented as an ADR
```
---
## Exceptions
None. Every team should have a defined escalation path.
---
## Consequences Of Violation
Uncertain violations are inconsistently handled. Some violations pass through; some PRs are unnecessarily blocked.

---
# Rule: Include Security Architecture In The Review Checklist
---
## Category
Security
---
## Rule
Always include security-specific items in the architecture review checklist, covering input validation, authentication checks, and data exposure concerns.
---
## Reason
Architecture decisions have security implications. A service that bypasses the authorization layer or a controller that exposes internal DTOs are architecture-level security issues that code review must catch.
---
## Bad Example
The architecture checklist covers import direction and naming conventions but has no security items. A PR introduces a new API endpoint without authentication because it was architecturally placed outside the auth middleware group.
---
## Good Example
```markdown
### Architecture Checklist — Security
- [ ] New endpoints are within authenticated middleware groups
- [ ] Data transfer objects do not expose internal entity fields
- [ ] Input validation is at the correct architectural layer
- [ ] Authorization checks are not bypassed by new code paths
```
---
## Exceptions
PRs that do not touch any security-sensitive code path.
---
## Consequences Of Violation
Security vulnerabilities are introduced at the architectural level. Authorization gaps, data leaks, and input validation bypasses go undetected.

---
# Rule: Limit Checklist Items To High-Impact Concerns
---
## Category
Architecture | Maintainability
---
## Rule
Keep architecture checklists focused on 5-10 high-impact items per change type. Remove items that are consistently checked without finding violations.
---
## Reason
Long checklists cause reviewer fatigue. When a checklist has 20+ items, reviewers skip them or check them automatically without thinking. Fewer, high-impact items get genuine attention.
---
## Bad Example
A 25-item checklist covering every possible architectural concern. Reviewers check all boxes without reading them. Important items are buried in noise.
---
## Good Example
```markdown
### Architecture Checklist — Refactoring
1. Does the refactoring maintain existing context boundaries?
2. Are interfaces/contracts preserved or updated correctly?
3. Is there any new coupling introduced?
```
---
## Exceptions
None. Shorter checklists are more effective.
---
## Consequences Of Violation
Checklist fatigue. Reviewers skip or automate the checklist mentally. True violations are missed because reviewers are overwhelmed by items.
