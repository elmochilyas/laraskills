## Rule 1: Write the RFC before writing the implementation code for any significant change
---
## Category
Architecture
---
## Rule
Require an approved RFC before merging any architectural change; "code first, RFC later" defeats the purpose.
---
## Reason
Retroactive RFCs bypass the review process, and the decision is already locked in by implementation.
---
## Bad Example
```
Developer submits PR with new message broker. Reviewer asks for RFC.
Developer: "I'll write it after this merges."
```
---
## Good Example
```
1. Write RFC for "Adopt RabbitMQ"
2. RFC reviewed, approved
3. Implement RabbitMQ integration
```
---
## Exceptions
Security patches or hotfixes where the change must deploy immediately followed by a post-mortem RFC.
---
## Consequences Of Violation
Unreviewed architectural decisions, rework, inconsistent patterns.
---
## Rule 2: Decide by merit of argument, not seniority
---
## Category
Architecture
---
## Rule
Base RFC acceptance on the quality of reasoning and evidence, not on the proposer's title or tenure.
---
## Reason
Decisions by seniority suppress better ideas from junior team members and create knowledge silos.
---
## Bad Example
```
Staff engineer: "I think we should use MongoDB."
Team: "OK" — no discussion.
```
---
## Good Example
```
RFC presents: tradeoffs, benchmark data, operational cost analysis.
Team votes based on evidence, not title.
```
---
## Exceptions
When architectural decisions are escalated explicitly for executive-level strategic or budget reasons.
---
## Consequences Of Violation
Suboptimal technology choices, team disengagement, knowledge concentration.
---
## Rule 3: Provide a lightweight option for trivial decisions
---
## Category
Architecture
---
## Rule
Offer a simplified "ADR-lite" or "decision log" format for small-to-medium decisions that still need a trace.
---
## Reason
Requiring full RFC for every decision causes process fatigue and slows delivery.
---
## Bad Example
```
Every variable rename requires a 2-page RFC.
```
---
## Good Example
```
Trivial: ADR-lite (status, context, decision, date — 3 lines)
Significant: Full RFC (context, options, tradeoffs, consequences)
```
---
## Exceptions
When the project explicitly requires full ADR documentation for compliance (SOC2, HIPAA).
---
## Consequences Of Violation
Process overhead, developer frustration, RFC abandonment.
---
## Rule 4: Make all RFCs searchable in a centralized, accessible location
---
## Category
Maintainability
---
## Rule
Store all RFCs in a shared repository with consistent naming; tag by date, status, and domain.
---
## Reason
Unsearchable RFCs lead to repeated decisions—teams unknowingly debate and decide the same issue multiple times.
---
## Bad Example
```
RFCs scattered across: email threads, Slack pins, personal notes, meeting minutes.
```
---
## Good Example
```
docs/rfcs/2026/RFC-2026-03-01-payment-gateway.md
```
---
## Exceptions
When the RFC involves security-sensitive information that requires access control.
---
## Consequences Of Violation
Repeated debates, contradictory decisions, wasted engineering time.
---
## Rule 5: Conduct lightweight retrospectives on past architectural decisions
---
## Category
Architecture
---
## Rule
After a significant migration or architectural change, review whether the decision achieved its goals and document lessons.
---
## Reason
Without retrospectives, the same mistakes repeat; feedback is lost and the team cannot improve its decision-making.
---
## Bad Example
```
Team migrates to event sourcing. Six months later, performance problems.
No one revisits the original decision tradeoffs.
```
---
## Good Example
```
6-month retrospective on ES adoption:
- Achieved: full audit trail ✓
- Cost: projection catch-up latency ✗
- Lesson: apply ES only to financial aggregates
```
---
## Exceptions
When the decision is too recent (< 1 month) for meaningful outcome evaluation.
---
## Consequences Of Violation
Repeated mistakes, no organizational learning, stagnation.
