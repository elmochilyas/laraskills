## Rule 1: Write an ADR before or during implementation—never as a post-hoc exercise
---
## Category
Architecture
---
## Rule
Create the ADR before code is merged; retroactive ADRs lose decision context and become rationalization.
---
## Reason
Post-hoc ADRs miss the real tradeoffs considered, alternatives evaluated, and the actual decision context.
---
## Bad Example
```yaml
# Written 3 months after the decision
title: "Use PostgreSQL"
status: "accepted"
context: "We use PostgreSQL."  # No context about alternatives or why
```
---
## Good Example
```yaml
title: "ADR-007: Adopt PostgreSQL for primary storage"
status: "proposed"
context: "MySQL's JSON indexing latency at 10M+ rows... evaluated MariaDB, CockroachDB"
options:
  - name: "MySQL"
    pros: ["familiar", "cheap"]
    cons: ["JSON perf"]
  - name: "PostgreSQL"
    pros: ["JSONB", "extensions"]
    cons: ["less managed hosting"]
decision: "PostgreSQL for JSONB and extension ecosystem"
```
---
## Exceptions
When the decision was urgent (security fix) and the ADR is written immediately after.
---
## Consequences Of Violation
Lost decision context, repeated debates, onboarding confusion.
---
## Rule 2: Clearly supersede old ADRs when a decision changes
---
## Category
Maintainability
---
## Rule
When a decision reverses, mark the old ADR as superseded and link to the new ADR that replaces it.
---
## Reason
Without supersession management, old and new ADRs appear equally active, causing confusion about which decision currently applies.
---
## Bad Example
```yaml
# Old ADR: "Use MySQL" — still marked "accepted" after migration to PostgreSQL
status: "accepted"
```
---
## Good Example
```yaml
# Old ADR
status: "superseded"
superseded-by: "ADR-008"
# New ADR
status: "accepted"
supersedes: "ADR-003"
```
---
## Exceptions
When the old ADR's decision still applies in a different bounded context.
---
## Consequences Of Violation
Developers follow outdated decisions, requiring rework.
---
## Rule 3: Reserve ADRs for decisions with significant, lasting impact
---
## Category
Architecture
---
## Rule
Do not create an ADR for trivial decisions (variable naming, library patch version, formatting).
---
## Reason
ADR fatigue causes the team to stop reading or maintaining them; each ADR should justify its existence.
---
## Bad Example
```yaml
title: "Use lodash instead of underscore"
# Trivial, low-impact decision
```
---
## Good Example
```yaml
title: "ADR-012: Adopt Laravel Reverb for real-time events"
context: "Pusher cost at 50K CCU ..."
```
---
## Exceptions
When a typically trivial decision has unusual risk or controversy that warrants documentation.
---
## Consequences Of Violation
ADR fatigue, maintenance burden, signal-to-noise degradation.
---
## Rule 4: Store ADRs in the same repository as the code they govern
---
## Category
Architecture
---
## Rule
Keep ADRs in a `docs/adr/` directory in the application repository, never in a separate wiki or document store.
---
## Reason
ADRs hidden in external systems are invisible during development, never reviewed with code, and become stale.
---
## Bad Example
```
// ADRs stored in Confluence wiki—deleted during cleanup
"Decision about payment gateway? Ask Bob, he remembers."
```
---
## Good Example
```
docs/adr/ADR-001-database-choice.md
docs/adr/ADR-002-event-bus-selection.md
```
---
## Exceptions
When ADRs cover cross-cutting infrastructure decisions shared across multiple repositories (publish to all repos).
---
## Consequences Of Violation
Lost decisions, repeated debates, decisions not found during code reviews.
---
## Rule 5: Enforce a mandatory review period and deadline for open RFCs/ADRs
---
## Category
Architecture
---
## Rule
Set a maximum review window (e.g., 5 business days); after expiry, the proposal is accepted by default or escalated.
---
## Reason
Without deadlines, RFCs stall indefinitely, blocking architectural progress and creating decision gridlock.
---
## Bad Example
```
ADR #42: "Message broker choice"
Status: "under review" — for 6 months
```
---
## Good Example
```
ADR #42: "Message broker choice"
Review deadline: 2026-03-10
Status: "accepted" (no blocking objections within window)
```
---
## Exceptions
For decisions requiring security review or regulatory approval where deadlines cannot be enforced.
---
## Consequences Of Violation
Architectural decisions blocked, team frustration, expedient ad-hoc choices.
