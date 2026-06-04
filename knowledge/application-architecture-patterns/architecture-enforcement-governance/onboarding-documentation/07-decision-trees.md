# Decision Trees: Onboarding Documentation for Architecture

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Architecture Enforcement and Governance
- **Knowledge Unit:** Onboarding documentation for architecture
- **Knowledge Unit ID:** AEG-10
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Onboarding doc in repo vs external wiki | Process | Documentation location |
| 2 | Guided tour (5-10 pages) vs comprehensive reference | Process | Documentation scope |
| 3 | Example-first documentation vs abstract description | Process | Documentation style |

---

## Decision 1: Onboarding doc in repo vs external wiki

### Context
Architecture onboarding documentation can live in the repository (`docs/onboarding.md`) or in an external system (Confluence, Notion, wiki). Repo-based docs are versioned with the code, updated alongside it, and accessible to everyone who clones the repo. External docs are accessible to non-developers but can drift from the codebase.

### Decision Tree

```
Where should the onboarding documentation live?
├── In the repository (`docs/onboarding.md`)
│   → Recommended for architecture documentation
│   Benefits:
│   ├── Versioned alongside the code
│   ├── Updated as part of the PR that changes the architecture
│   ├── Available in the repository — no external login needed
│   └── Can link to code examples, patterns, and tests directly
│   └── Is the team 100% developer?
│       ├── YES → Repository is ideal
│       └── NO (PMs, designers also need access)
│           → Consider a summary in a shared location + repo details
├── In an external wiki (Confluence, Notion)
│   → NOT recommended for architecture documentation
│   Problems:
│   ├── Not versioned with code — outdated reference
│   ├── No PR process for updating — may be edited directly
│   ├── External login required — not everyone has access
│   └── Drifts from the codebase over time
│   └── When is external acceptable?
│       ├── Company-wide onboarding that references the repo doc
│       └── NEVER as the primary architecture onboarding document
└── In both (repo + external)
    → Dual-maintenance overhead
    Must keep both in sync
    Drift between them is common
    One always becomes stale
```

### Rationale
The repository is the best place for architecture onboarding documentation because it's versioned with the code. When a PR changes the architecture, the onboarding doc is updated in the same PR. The doc is always in sync with the current codebase. External wikis are not versioned, have no PR process, and drift from the codebase. The only exception is for company-wide onboarding flows that need to reach non-developers — in that case, maintain a summary externally with a link to the repo for details.

### Recommended Default
Repository (`docs/onboarding.md`) — versioned alongside the code

### Risks
- External wiki: outdated, no PR process, drifts from codebase
- Dual-maintenance: both locations drift, which is authoritative?
- No onboarding doc at all: new developers learn by asking (bottleneck)

### Related Rules
- Keep The Onboarding Doc At 5-10 Pages (AEG-10/05-rules.md)
- Update The Onboarding Doc When Architecture Changes (AEG-10/05-rules.md)
- Link To ADRs, Convention Doc, And Architecture Tests (AEG-10/05-rules.md)

### Related Skills
- Create Onboarding Documentation for Architecture (AEG-10/06-skills.md)
- Document Team Conventions (AEG-07/06-skills.md)
- Document ADRs (AEG-06/06-skills.md)

---

## Decision 2: Guided tour (5-10 pages) vs comprehensive reference

### Decision Tree

```
How much detail should the onboarding document contain?
├── Guided tour — 5-10 pages
│   → Recommended approach
│   Content:
│   ├── Bounded context map (1 page) — what are the parts, how do they relate
│   ├── Dependency direction rules (1 page) — what can import from what
│   ├── Common patterns with examples (3-5 pages) — how things are built
│   ├── Tooling and workflow (1 page) — tests, linting, CI
│   └── Reference links (1 page) — ADRs, conventions, test files
│   A new developer reads this in one sitting (2-3 hours)
│   Gets the mental model without being overwhelmed
├── Comprehensive reference — 50+ pages
│   → NOT recommended as onboarding material
│   Content:
│   ├── Every class documented
│   ├── Every convention explained in detail
│   ├── Every configuration option described
│   └── Every deployment script annotated
│   Problems:
│   ├── Too overwhelming — new developers read the first 10 pages and stop
│   ├── Too long to maintain — will go out of date quickly
│   └── Too detailed — can't find the important patterns among the noise
│   Instead: keep the onboarding doc a guided tour
│   Create separate reference docs for deep details
└── No structured onboarding
    → New developers learn by asking
    Senior developers become bottlenecks
    Knowledge transfer is slow and uneven
```

### Rationale
A 5-10 page onboarding document is a guided tour, not a reference manual. The goal is to transfer the mental model — the high-level understanding that lets a new developer make safe architectural decisions. Details belong in reference documents that are linked from the onboarding doc. A 50-page document is never read in full. A 10-page document is read in one sitting. The key is to prioritize: context map first, dependency rules second, common patterns third, and tooling/workflow last.

### Recommended Default
5-10 page guided tour with links to detailed reference docs

### Risks
- Too long: overwhelming, not read, mental model not transferred
- Too short: missing essential information, developer still confused
- No onboarding: senior developer bottleneck, slow knowledge transfer

### Related Rules
- Keep The Onboarding Doc At 5-10 Pages (AEG-10/05-rules.md)
- Always Include A Bounded Context Map (AEG-10/05-rules.md)
- Provide A Step-By-Step Onboarding Checklist (AEG-10/05-rules.md)

### Related Skills
- Create Onboarding Documentation for Architecture (AEG-10/06-skills.md)
- Document ADRs (AEG-06/06-skills.md)
- Document Team Conventions (AEG-07/06-skills.md)

---

## Decision 3: Example-first documentation vs abstract description

### Decision Tree

```
How should each architecture pattern be documented in onboarding?
├── Example-first — concrete before/after code examples
│   → Recommended approach
│   For each pattern:
│   1. Short description (1-2 sentences)
│   2. Before (wrong way) code example
│   3. After (correct way) code example
│   4. Link to full example in the codebase
│   Example:
│   ├── Description: "Use Action classes for single-responsibility operations"
│   ├── Before: 30-line controller with inline logic
│   ├── After: controller delegates to Action class
│   └── Benefits: developer sees the pattern in real code immediately
├── Abstract description — explain the pattern in prose
│   → Less effective — hard to translate to actual code
│   "Services are classes that encapsulate business logic."
│   "They should be injected into controllers via dependency injection."
│   "They should not be tightly coupled to HTTP concerns."
│   Problems:
│   ├── Abstract: developer reads it but doesn't know what it looks like
│   ├── Without concrete code, the pattern is ambiguous
│   └── Developer must search the codebase for examples anyway
└── No pattern documentation — reference the codebase only
    → Least effective — developer must reverse-engineer patterns
    "Look at how OrderService and PaymentService are implemented"
    The developer must figure out the pattern from 10+ examples
    Slow, error-prone, inconsistent interpretations
```

### Rationale
Example-first documentation is the most effective way to teach architecture patterns. A developer understands "before/after" code examples much faster than abstract descriptions. The before example shows what not to do; the after example shows the correct approach. The developer can immediately see the pattern in concrete terms. Abstract descriptions are valuable as context but should be minimal — let the code examples do the teaching. Every pattern in the onboarding doc should have a before/after code example.

### Recommended Default
Example-first documentation (before/after code examples) for every pattern

### Risks
- Abstract only: ambiguous, developer doesn't know what pattern looks like
- No documentation: developer reverse-engineers from codebase — slow and inconsistent
- Examples without descriptions: developer sees code but doesn't know why it's correct

### Related Rules
- Use Example-First Documentation (AEG-10/05-rules.md)
- Always Include A Bounded Context Map (AEG-10/05-rules.md)
- Gate Onboarding On Passing Architecture Tests (AEG-10/05-rules.md)

### Related Skills
- Create Onboarding Documentation for Architecture (AEG-10/06-skills.md)
- Document Team Conventions (AEG-07/06-skills.md)
- Document ADRs (AEG-06/06-skills.md)
