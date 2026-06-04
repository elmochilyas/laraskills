# Decision Trees: Architecture Decision Records (ADRs)

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Architecture Enforcement and Governance
- **Knowledge Unit:** Architecture Decision Records (ADRs)
- **Knowledge Unit ID:** AEG-06
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | ADR vs no documentation (verbal decision) | Process | Decision documentation strategy |
| 2 | Write ADR before implementation vs after | Process | ADR timing |
| 3 | ADR vs team convention documentation | Process | Documentation type selection |

---

## Decision 1: ADR vs no documentation (verbal decision)

### Context
When an architecture decision is made, it can be documented as an ADR (written record with context, options, rationale) or left as a verbal/oral decision (discussed in a meeting or Slack). Verbal decisions are fast but have no permanent record. ADRs take time to write but provide lasting context.

### Decision Tree

```
What is the impact of this decision?
├── Significant — affects multiple teams, long-lasting, hard to reverse
│   → Write an ADR
│   Examples:
│   ├── "Use RabbitMQ for async processing" (affects infrastructure, contracts)
│   ├── "Adopt event sourcing for Order aggregate" (affects persistence strategy)
│   └── "Split Billing into separate bounded context" (affects team structure)
│   The decision should be documented with context, options, and rationale
├── Moderate — affects a single team, medium-term impact
│   → Write an ADR (shorter version)
│   Examples:
│   ├── "Add a Service layer between Controllers and Repositories"
│   └── "Use Pest for architecture testing"
│   1-2 pages is sufficient
├── Minor — routine implementation choice, easy to reverse
│   → No ADR needed
│   Examples:
│   ├── "Use Carbon for date handling"
│   ├── "Name this variable $totalAmount"
│   └── "Format this response as JSON"
│   Code comments or commit messages are sufficient
└── Temporary — clearly will be removed soon
    → No ADR needed
    "This workaround will be removed in Q3"
    Don't document decisions that won't outlast the current quarter
```

### Rationale
Not every decision needs an ADR. The effort of writing and reviewing an ADR is justified for decisions with lasting impact that are hard to reverse. Routine implementation choices don't need ADRs — they can be documented in code comments or commit messages. The test is: "Will the team still need to know why this decision was made in 6 months?" If yes, write an ADR. If no, a lighter form of documentation is fine.

### Recommended Default
ADR for significant, long-lasting decisions; no ADR for routine or temporary choices

### Risks
- No ADR for significant decisions: rationale lost, decision revisited repeatedly
- ADR for every decision: documentation overhead, team stops reading them
- Verbal decisions without follow-up: no record, knowledge lost when team changes

### Related Rules
- Write ADRs Before Implementing The Decision (AEG-06/05-rules.md)
- Include Rejected Options With Rationale (AEG-06/05-rules.md)
- Keep ADRs Short (1-2 Pages) (AEG-06/05-rules.md)

### Related Skills
- Document Architecture Decisions as ADRs (AEG-06/06-skills.md)
- Document Team Conventions (AEG-07/06-skills.md)
- Create Onboarding Documentation (AEG-10/06-skills.md)

---

## Decision 2: Write ADR before implementation vs after

### Decision Tree

```
When should the ADR be written relative to the implementation?
├── Before implementation (RECOMMENDED)
│   Process:
│   1. Decision is proposed
│   2. ADR is drafted: context, options, decision, consequences
│   3. ADR is reviewed by the team
│   4. If ADR is accepted, implementation begins
│   Pros:
│   ├── Forces clarity of thought before coding
│   ├── Weak rationale is caught early — prevents wasted implementation
│   ├── Team alignment before code is written
│   └── ADR captures the actual decision context (not post-hoc justification)
├── After implementation (ADOC — Architecture Decision Observed/Consequence)
│   → Only for emergency decisions or retroactive documentation
│   Pros:
│   ├── Documents decisions made under time pressure
│   └── Captures lessons for future reference
│   Cons:
│   ├── Post-hoc justification: "we did this, here's why we say we did it"
│   ├── Alternatives considered during implementation may be forgotten
│   └── ADR has less value — implementation already done
│   └── Is the decision an emergency fix?
│       ├── YES → ADR after (within 24 hours)
│       └── NO → Write ADR before — no excuse
└── Never (no ADR at all)
    → Verbal decision — rationale lost
    Team debates the same decision repeatedly
```

### Rationale
Writing the ADR before implementation forces clarity. If the rationale is weak or the tradeoffs are not well understood, the ADR exposes this before code is written — avoiding costly implementation of poorly-thought-out decisions. After-implementation ADRs are post-hoc justifications that often omit alternatives that were considered but not chosen. The only exception is emergency fixes where there is no time to write the ADR first — in that case, write it within 24 hours after the fix.

### Recommended Default
Write ADR before implementation; after-implementation only for emergency fixes

### Risks
- ADR after implementation: post-hoc justification, incomplete rationale
- No ADR at all: rationale lost, decisions revisited indefinitely
- Too slow on ADR before: analysis paralysis — use a reasonable deadline

### Related Rules
- Write ADRs Before Implementing The Decision (AEG-06/05-rules.md)
- Review ADRs As Part Of The Pull Request (AEG-06/05-rules.md)
- Include Rejected Options With Rationale (AEG-06/05-rules.md)

### Related Skills
- Document Architecture Decisions as ADRs (AEG-06/06-skills.md)
- Apply Code Review Guardrails (AEG-04/06-skills.md)
- Document Team Conventions (AEG-07/06-skills.md)

---

## Decision 3: ADR vs team convention documentation

### Decision Tree

```
What is the nature of the information to document?
├── A single significant decision with context, options, and rationale
│   → ADR
│   Characteristics:
│   ├── "Why did we choose RabbitMQ over Kafka?"
│   ├── "Should we use Repository pattern or direct Eloquent access?"
│   └── Addresses a specific question with a specific answer
│   Best for: decisions that needed deliberation and could have gone differently
├── An ongoing team practice or convention
│   → Team convention documentation (not ADR)
│   Characteristics:
│   ├── "How do we structure our service providers?"
│   ├── "What naming conventions do we use for tests?"
│   ├── "When to use Actions vs Jobs?"
│   └── Codifies team habits and practices
│   Best for: reference documentation, onboarding, consistent practices
│   Storage: `docs/conventions/` or README files
│   Different from ADR: no decision context or rejected options needed
├── Both — a team convention that resulted from a decision
│   → Two documents: ADR (the decision) + convention doc (the practice)
│   ADR captures the decision: "We decided to use Action classes"
│   Convention doc captures the practice: "How to write an Action class"
│   Both reference each other
└── Project overview or architecture description
    → Architecture documentation (not ADR)
    "What does the application look like?"
    ADRs capture why, not what
```

### Rationale
ADRs and convention documentation serve different purposes. ADRs answer "why" — they capture the context, options, and rationale for a specific decision. Convention documentation answers "how" — it describes the team's current practices. Mixing them creates confusion: an ADR that reads like a tutorial is hard to reference for decisions, and a convention doc with decision history is hard to use as a reference. Keep them separate but cross-reference when a convention was driven by a specific decision.

### Recommended Default
ADR for significant decisions; convention docs for ongoing practices

### Risks
- ADR for conventions: missing decision context, ADR is actually a tutorial
- Conventions doc for decisions: no rationale, team doesn't know why they follow the convention
- No cross-reference: team using a convention without knowing why it exists

### Related Rules
- Keep ADRs Short (1-2 Pages) (AEG-06/05-rules.md)
- Store ADRs In `docs/adr/` (AEG-06/05-rules.md)
- Document One Decision Per ADR (AEG-06/05-rules.md)

### Related Skills
- Document Architecture Decisions as ADRs (AEG-06/06-skills.md)
- Document Team Conventions (AEG-07/06-skills.md)
- Create Onboarding Documentation (AEG-10/06-skills.md)
