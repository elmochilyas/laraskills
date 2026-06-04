# Decision Trees: Team Convention Documentation

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Architecture Enforcement and Governance
- **Knowledge Unit:** Team convention documentation
- **Knowledge Unit ID:** AEG-07
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Single convention doc vs multiple focused docs | Process | Documentation structure |
| 2 | Link conventions to tests vs standalone conventions | Process | Convention-enforcement linkage |
| 3 | Convention doc vs ADR for documenting practices | Process | Documentation type selection |

---

## Decision 1: Single convention doc vs multiple focused docs

### Context
Team conventions can be documented in a single file or split across multiple files (code-style.md, architecture-conventions.md, testing-standards.md). A single file is easier to find and maintain. Multiple files make it harder to know which file is current and which to update.

### Decision Tree

```
How many convention documents does the project have?
├── One — `docs/conventions.md`
│   → Correct approach
│   All conventions in a single file with clear section headers:
│   ├── Code Style
│   ├── Architecture Patterns
│   ├── Testing Practices
│   ├── Deployment Conventions
│   └── Security Practices
│   Pros: easy to find, single source of truth, one file to update
│   Cons: can grow long (mitigated by linking to detailed reference docs)
├── Multiple — separate files per concern
│   → NOT recommended (unless the project is very large)
│   Risks:
│   ├── Which file is authoritative when they conflict?
│   ├── Which file to update on a cross-cutting change?
│   ├── New developers don't know all the files exist
│   └── Some files get updated, others don't
│   Side project with independent repos?
│   ├── YES → Each repo has its own `docs/conventions.md`
│   └── NO → Single file per project is sufficient
└── None — conventions exist only in team members' heads
    → Tribal knowledge anti-pattern
    No written record
    Senior developers become bottlenecks
    New developers learn by osmosis (slow, uneven)
```

### Rationale
A single convention document is the default because it eliminates the question "where is that documented?" — the answer is always `docs/conventions.md`. Multiple files create the "where is this documented?" overhead that discourages developers from checking conventions. If the single file grows beyond what's manageable, split by concern within the file using clear section headers, but keep it in one file. The only exception is if the project is large enough to warrant separate docs.

### Recommended Default
Single `docs/conventions.md` with clear section headers

### Risks
- Multiple files: confusion about which is authoritative, uneven updates
- No convention doc: tribal knowledge, senior developer bottleneck
- Single file too long: difficult to navigate — use section headers and table of contents

### Related Rules
- Maintain A Single Convention Doc Per Project (AEG-07/05-rules.md)
- Link Each Convention Section To Architecture Tests (AEG-07/05-rules.md)
- Keep Conventions Concise (AEG-07/05-rules.md)

### Related Skills
- Document Team Conventions as a Living Reference (AEG-07/06-skills.md)
- Document ADRs (AEG-06/06-skills.md)
- Create Onboarding Documentation (AEG-10/06-skills.md)

---

## Decision 2: Link conventions to tests vs standalone conventions

### Decision Tree

```
Can the convention be enforced by an architecture test?
├── YES — the convention is structural or type-level
│   → Link the convention section to the corresponding architecture test
│   Convention: "Services must not call facades statically"
│   Link: `tests/Architecture/FacadeRules.php :: test('Services must not use facades statically')`
│   Benefits:
│   ├── Reader knows the convention is enforced (not just aspirational)
│   ├── Reader can see the exact rule in the test
│   └── If the convention is updated, the test must also be updated
├── NO — the convention requires human judgment
│   → Mark explicitly as "unenforceable" or "aspirational"
│   Convention: "Choose meaningful names for classes"
│   This cannot be automated
│   Exceptions: explicitly marked and accepted as non-enforceable
│   └── Is this convention important enough to document without enforcement?
│       ├── YES → Document with explicit "not testable" marker
│       └── NO → Consider removing — conventions that aren't enforced
│           may not be followed
└── Is the convention enforced but the link is missing?
    → Add the link — the test exists, the doc should reference it
    Without the link, readers don't know the convention is enforced
```

### Rationale
A convention linked to a passing test is proven to be followed. A convention without a test link is aspirational at best — readers don't know if it's enforced or just a suggestion. Links also connect the convention to the enforcement mechanism: if someone changes the convention, they must also update the test. This prevents the common problem of conventions drifting from actual enforcement. Unenforceable conventions (design quality, naming philosophy) should be explicitly marked as non-testable.

### Recommended Default
Link every enforceable convention section to its architecture test

### Risks
- No links: readers can't distinguish enforced rules from suggestions
- Links to deleted tests: stale references, conventions lose credibility
- Unenforceable conventions without markers: readers assume they're enforced

### Related Rules
- Link Each Convention Section To Architecture Tests (AEG-07/05-rules.md)
- Keep Conventions Concise (AEG-07/05-rules.md)
- Reference Conventions In Code Review Comments (AEG-07/05-rules.md)

### Related Skills
- Document Team Conventions as a Living Reference (AEG-07/06-skills.md)
- Encode Rules as Architecture Tests (AEG-01/06-skills.md)
- Apply Code Review Guardrails (AEG-04/06-skills.md)

---

## Decision 3: Convention doc vs ADR for documenting practices

### Decision Tree

```
What is being documented?
├── An ongoing team practice or standard
│   → Convention doc (`docs/conventions.md`)
│   Examples:
│   ├── "Services must not call facades statically"
│   ├── "All controllers must end with 'Controller'"
│   ├── "Use Pest for feature tests, PHPUnit for unit tests"
│   └── These describe how the team works, not why a specific decision was made
├── A specific architecture decision with rationale
│   → ADR (`docs/adr/NNN-title.md`)
│   Examples:
│   ├── "Why we chose RabbitMQ over Kafka"
│   ├── "Why we adopted event sourcing for Orders"
│   └── These answer "why" — context, options considered, rejected alternatives
├── Both — a practice that resulted from a specific decision
│   → Two documents: ADR + convention doc entry
│   ADR: "Why we use Action classes (ADR-0014)"
│   Convention: "How to write an Action class (see ADR-0014)"
│   Cross-reference each other
│   └── Is the practice well-established and stable?
│       ├── YES → Both ADR (decision) and convention (practice)
│       └── NO → Start with an ADR, add convention once stable
└── An onboarding resource
    → Separate onboarding doc (5-10 pages, guided tour)
    Links to both conventions and ADRs for deeper reference
```

### Rationale
Convention docs capture "how we build things now" — the current practices that the team follows. ADRs capture "why we decided this" — the decision context and rationale. They serve different purposes and should be separate. A convention doc entry says "Controllers must not use Models." An ADR says "We adopted the Service Layer pattern to isolate business logic from HTTP concerns." Mixing them creates confusion: the ADR becomes a tutorial, and the convention doc loses its decision context. Keep them separate and cross-reference.

### Recommended Default
Convention doc for practices; ADRs for decisions; cross-reference when appropriate

### Risks
- Convention in ADR: hard to find practices, ADR is used as a tutorial
- ADR in convention: missing decision context, convention doc becomes unwieldy
- Neither: practices undocumented (tribal knowledge) or decisions justified (no record)

### Related Rules
- Maintain A Single Convention Doc Per Project (AEG-07/05-rules.md)
- Write ADRs Before Implementing The Decision (AEG-06/05-rules.md)
- Keep Conventions Concise (AEG-07/05-rules.md)

### Related Skills
- Document Team Conventions as a Living Reference (AEG-07/06-skills.md)
- Document Architecture Decisions as ADRs (AEG-06/06-skills.md)
- Create Onboarding Documentation (AEG-10/06-skills.md)
