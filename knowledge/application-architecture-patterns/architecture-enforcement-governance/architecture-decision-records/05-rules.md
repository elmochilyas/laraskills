# Rule: Write ADRs Before Implementing The Decision
---
## Category
Architecture
---
## Rule
Write the Architecture Decision Record before implementing the decision, not after. If the ADR rationale is weak, rethink before coding.
---
## Reason
Writing the ADR first forces clarity of thought. If the rationale, options, and tradeoffs cannot be clearly articulated, the decision is not ready to implement. Writing afterward turns the ADR into a justification, not a decision document.
---
## Bad Example
A new service layer is implemented over three weeks. After implementation, an ADR is written to "document" the decision. The ADR does not capture the real alternatives considered during implementation.
---
## Good Example
```
1. Architecture decision is proposed.
2. ADR is drafted: context, options, decision, consequences.
3. ADR is reviewed by the team.
4. Implementation begins.
```
---
## Exceptions
Emergency fixes where the architecture decision is made under time pressure. Write the ADR within 24 hours after the fix.
---
## Consequences Of Violation
ADRs become post-hoc justifications rather than decision records. Alternatives that were considered during implementation are lost. The ADR has less value for future readers.

---
# Rule: Include Rejected Options With Rationale
---
## Category
Architecture
---
## Rule
Always document rejected options and the reasons they were rejected in the ADR. Never list only the chosen option.
---
## Reason
The rejected options are as valuable as the chosen one. Future readers need to know that alternatives were considered and why they were dismissed. Without this, the same rejected options will be proposed again and debated from scratch.
---
## Bad Example
```markdown
# ADR-0012: Use RabbitMQ for async processing
Decision: Use RabbitMQ.
```
Future developers do not know if Redis, SQS, or Kafka were considered, or why they were rejected.
---
## Good Example
```markdown
# ADR-0012: Use RabbitMQ for async processing
Decision: Use RabbitMQ.

Rejected Options:
1. Redis — rejected: no native pub/sub guarantees; messages can be lost.
2. SQS — rejected: higher latency and vendor lock-in to AWS.
3. Kafka — rejected: over-engineered for our current volume (500 msg/sec).
```
---
## Exceptions
When the rejected options are obvious to the team and documented elsewhere (e.g., a tech stack decision document).
---
## Consequences Of Violation
Recurring debates about already-rejected options. Time wasted re-evaluating alternatives that were previously dismissed for good reasons.

---
# Rule: Review ADRs As Part Of The Pull Request
---
## Category
Architecture
---
## Rule
Always include new ADRs or ADR changes in the same pull request as the code that implements the decision. Review the ADR alongside the code.
---
## Reason
Reviewing the ADR and the code together ensures the implementation matches the decision. It keeps the ADR connected to the actual code change. A standalone ADR PR may be reviewed differently than the code it describes.
---
## Bad Example
An ADR is created in a separate PR and merged before the implementation PR. The implementation PR deviates from the ADR in ways that are not caught because reviewers do not cross-reference them.
---
## Good Example
Pull request contains:
1. `docs/adr/0014-use-action-classes.md` — the ADR
2. `app/Actions/ProcessOrderAction.php` — the implementation
3. Architecture tests that enforce the new pattern

Reviewers check that the implementation matches the ADR.
---
## Exceptions
ADRs that document decisions made in the past (retroactive ADRs) without current implementation changes.
---
## Consequences Of Violation
Implementation and documentation diverge. The ADR describes one thing, the code does another. The ADR loses credibility as a trusted reference.

---
# Rule: Keep ADRs Short (1-2 Pages)
---
## Category
Architecture | Maintainability
---
## Rule
Keep each ADR to 1-2 pages. If a decision requires more documentation, split it into multiple focused ADRs.
---
## Reason
ADRs longer than 2 pages are not read. Concise ADRs are more likely to be referenced and maintained. A single ADR covering one decision (not a design document) can be captured in 1-2 pages.
---
## Bad Example
A 10-page ADR covering the entire event-driven architecture decision — including event schemas, infrastructure setup, deployment strategy, and monitoring. No one finishes reading it. Key decisions are buried.
---
## Good Example
```
ADR-0014: Use Event Sourcing for Order Processing (1.5 pages)
- Context: 3 paragraphs
- Options: 4 options summarized in a table
- Decision: 2 paragraphs
- Consequences: 3 bullet points each for pros and cons
```
---
## Exceptions
Complex decisions that genuinely require more space. Even then, consider splitting into sub-decisions.
---
## Consequences Of Violation
ADRs are not read. Key decisions are buried in lengthy documents. The team stops creating ADRs because they are too much work.

---
# Rule: Store ADRs In `docs/adr/` In The Repository
---
## Category
Architecture | Maintainability
---
## Rule
Always store ADRs in the repository at `docs/adr/` with sequential numbering. Never store ADRs in a wiki, Confluence, or separate documentation system.
---
## Reason
ADRs in the repository are versioned alongside the code. Any developer cloning the repo has the full architecture history. External documentation systems are not versioned, not accessible without credentials, and often out of sync with the code.
---
## Bad Example
ADRs are stored in a Confluence space. When a new developer joins, they do not know the Confluence space exists. The ADRs are never updated because they are not part of the development workflow.
---
## Good Example
```
docs/adr/
├── README.md
├── 0001-use-laravel-for-backend.md
├── 0002-modular-monolith-structure.md
├── 0003-use-event-sourcing-for-orders.md
└── 0014-use-action-classes.md
```
ADR files are linked in PR descriptions and code review comments.
---
## Exceptions
None. ADRs belong in the repository alongside the code they describe.
---
## Consequences Of Violation
ADRs are lost when the external system changes. New team members cannot find them. ADRs are not updated because they are not part of the development workflow.

---
# Rule: Document One Decision Per ADR
---
## Category
Architecture | Maintainability
---
## Rule
Capture exactly one architecture decision per ADR. Never combine multiple decisions into a single ADR.
---
## Reason
A single decision per ADR makes each record independently referenceable, supersedeable, and reviewable. Combined decisions cannot be superseded independently — updating one decision requires rewriting the entire ADR.
---
## Bad Example
ADR-0005 covers "Use PostgreSQL, Redis, and RabbitMQ" — three technology decisions in one document. Six months later, Redis is replaced with Valkey. The entire ADR-0005 must be rewritten.
---
## Good Example
```
ADR-0005: Use PostgreSQL as Primary Database
ADR-0006: Use Redis for Caching
ADR-0007: Use RabbitMQ for Async Processing
```
When Redis is replaced, only ADR-0006 is superseded.
---
## Exceptions
Decisions that are inherently coupled and cannot be decided independently.
---
## Consequences Of Violation
ADRs cannot be partially superseded. The entire document becomes obsolete when one decision changes. The team stops referencing ADRs because they contain a mix of current and outdated decisions.

---
# Rule: Mark Superseded ADRs Clearly
---
## Category
Architecture | Maintainability
---
## Rule
When a decision is superseded, update the original ADR to include a clear `Superseded by ADR-NNN` header and a brief reason. Never delete or archive superseded ADRs.
---
## Reason
Superseding, not deleting, preserves the decision history. Future readers can trace the evolution of the architecture. A deleted ADR erases the context of why a decision was made, leading to repeated debates.
---
## Bad Example
ADR-0003 "Use Redis for Caching" is deleted when the team migrates to Valkey. A new developer proposes "Why not use Redis?" because they do not know Redis was used and replaced.
---
## Good Example
```markdown
# ADR-0003: Use Redis for Caching
Status: Superseded by ADR-0015
Superseded Reason: Redis licensing changes; migrated to Valkey for
open-source compatibility. See ADR-0015 for details.
```
---
## Exceptions
ADRs that were never implemented (Status: Rejected) do not need supersession marking.
---
## Consequences Of Violation
Architecture history is lost. The team cannot trace why decisions changed. Superseded alternatives are proposed again, wasting time in re-evaluation.

---
# Rule: Never Include Secrets Or Credentials In ADRs
---
## Category
Security
---
## Rule
Never include passwords, API keys, tokens, connection strings, or any security-sensitive information in an ADR.
---
## Reason
ADRs are stored in the repository and visible to everyone with repository access. Including secrets in ADRs creates a permanent security exposure that cannot be easily removed (Git history retains the data).
---
## Bad Example
```markdown
# ADR-0008: Use Stripe for Payments
Configuration:
- API Key: sk_live_abc123def456
- Webhook Secret: whsec_xyz789
```
---
## Good Example
```markdown
# ADR-0008: Use Stripe for Payments
Configuration is managed through environment variables and the
`config/services.php` file. API keys are stored in the secrets manager.
```
---
## Exceptions
None. Secrets do not belong in ADRs.
---
## Consequences Of Violation
Credentials are exposed to everyone with repository access. They are permanently retained in Git history even if removed later. A security incident is created.
