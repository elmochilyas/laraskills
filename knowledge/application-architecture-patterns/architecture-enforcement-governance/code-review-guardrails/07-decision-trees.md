# Decision Trees: Code Review Guardrails for Architecture

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Architecture Enforcement and Governance
- **Knowledge Unit:** Code review guardrails for architecture
- **Knowledge Unit ID:** AEG-04
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Automated enforcement vs human review | Architecture | Enforcement strategy per rule |
| 2 | Architecture-first review vs implementation-first review | Architecture | Code review order |
| 3 | Generic checklist vs change-type-specific checklist | Architecture | PR checklist design |

---

## Decision 1: Automated enforcement vs human review

### Context
Every architectural rule can be enforced either by automation (Pest tests, PHPStan, linters) or by human code review. Automation is fast, reliable, and consistent — it never forgets and never gets tired. Human review is slow, expensive, and inconsistent. But some concerns (abstraction level, design quality, consistency) cannot be automated.

### Decision Tree

```
Can this architectural rule be encoded as an automated check?
├── YES → Automate it
│   Structural rules: import direction, naming conventions, layer isolation
│   Type-level rules: return types, interface implementation, forbidden calls
│   Mechanism:
│   ├── Import/structural → Pest architecture test
│   ├── Type-level/method calls → PHPStan custom rule
│   └── Simple forbidden calls → `spaze/phpstan-disallowed-calls`
│   Once automated, remove from human review checklist
│   └── Is the rule stable?
│       ├── YES → Automate immediately
│       └── NO (experimental, may change) → Human review until stable
├── NO — it requires human judgment
│   → Reserve for code review
│   Examples:
│   ├── "Is this the right abstraction level?"
│   ├── "Does this introduce unnecessary coupling?"
│   ├── "Is this responsibility in the right place?"
│   └── "Will this design scale to expected load?"
│   These require understanding context, tradeoffs, and design philosophy
└── Is the rule enforced by both currently?
    → Remove the automated one from human review
    If an automated test exists, the human reviewer should not waste time on it
```

### Rationale
Wasting human review time on checks a machine could do is the most common code review anti-pattern. When a reviewer spends time checking "are all services in the Services namespace?" they're not thinking about whether the design is correct. Automate everything that can be automated. Reserve human review for the 20% of concerns that require judgment: abstraction quality, design consistency, architectural fit. This makes reviews faster and more valuable.

### Recommended Default
Automate every enforceable rule; reserve human review for non-automatable design concerns

### Risks
- No automation: human reviewers check trivial rules, miss important design issues
- Over-automation: false confidence — automation can't catch design quality violations
- Both enforce same rule: redundant, reviewer ignores automated checks

### Related Rules
- Automate Every Enforceable Rule Before Relying On Code Review (AEG-04/05-rules.md)
- Apply Architecture-First Review Order (AEG-04/05-rules.md)
- Document Architecture Decisions From Code Review As ADRs (AEG-04/05-rules.md)

### Related Skills
- Apply Code Review Guardrails for Architecture (AEG-04/06-skills.md)
- Encode Rules as Architecture Tests (AEG-01/06-skills.md)
- Configure Static Analysis Rules (AEG-03/06-skills.md)

---

## Decision 2: Architecture-first review vs implementation-first review

### Decision Tree

```
What does the reviewer evaluate first?
├── Architecture and design (before reading implementation)
│   → Architecture-first review
│   Steps:
│   1. Read PR title and description (2 min) — understand architectural intent
│   2. Read diff at file-structure level (3 min) — which contexts, layers, namespaces
│   3. Evaluate architectural impact (5 min) — violations, new coupling, design quality
│   4. Then read implementation details
│   If architecture is wrong, reject early — saves review time
├── Implementation details (before considering architecture)
│   → Implementation-first review (anti-pattern)
│   Reviewer reads code line by line first
│   After 30 minutes of code review, less willing to suggest fundamental changes
│   Anchoring bias: "I've already reviewed this code, it looks fine"
│   └── Is the PR trivial (single line, dependency update)?
│       ├── YES → Implementation-first is fine
│       └── NO → Use architecture-first
└── Architecture only (no implementation review)
    → Too far — architecture matters but implementation matters too
    Need both: architecture first, then implementation
```

### Rationale
Architecture-first review prevents wasted effort on fundamentally wrong designs. When the architecture is wrong, the implementation details don't matter — the code needs to be restructured anyway. Reviewing implementation first creates anchoring bias: after investing time in code-level review, the reviewer is less likely to suggest structural changes. The architecture review takes 10 minutes. If it passes, the reviewer proceeds to implementation. If it fails, no implementation review time was wasted.

### Recommended Default
Architecture-first review order for all non-trivial PRs

### Risks
- Architecture-first without context: reviewer may misunderstand the design intent
- Implementation-first: anchoring bias, architectural issues missed after code review
- Skipping architecture review entirely: the most expensive mistakes go unnoticed

### Related Rules
- Apply Architecture-First Review Order (AEG-04/05-rules.md)
- Automate Every Enforceable Rule Before Relying On Code Review (AEG-04/05-rules.md)
- Document Architecture Decisions From Code Review As ADRs (AEG-04/05-rules.md)

### Related Skills
- Apply Code Review Guardrails for Architecture (AEG-04/06-skills.md)
- Encode Rules as Architecture Tests (AEG-01/06-skills.md)
- Implement Import Violation Detection (AEG-05/06-skills.md)

---

## Decision 3: Generic checklist vs change-type-specific checklist

### Decision Tree

```
What type of change does the PR represent?
├── New module (new bounded context, new subsystem)
│   → Specific checklist: New Module
│   Checks:
│   ├── Module follows bounded context structure (layers?)
│   ├── Service layer exists and is separate from controllers
│   ├── Repository interface exists in Contracts
│   ├── Module registered in service provider
│   └── Architecture tests exist for the new module
├── Cross-context change (modifies multiple contexts)
│   → Specific checklist: Cross-Context Change
│   Checks:
│   ├── New imports respect the dependency map
│   ├── No transitive dependencies introduced
│   ├── Context boundaries maintained (no leaky abstractions)
│   └── Shared kernel not polluted with context-specific code
├── Refactoring (restructuring without new behavior)
│   → Specific checklist: Refactoring
│   Checks:
│   ├── Behavior preserved (no behavioral changes mixed in)
│   ├── Abstraction level appropriate
│   └── No new coupling introduced
├── Bug fix (behavior change to fix a defect)
│   → Specific checklist: Bug Fix
│   Checks:
│   ├── Fix targets the right layer (not a workaround)
│   └── No unrelated architectural changes in the fix
└── Generic checklist (one size fits all)
    → NOT recommended — too vague to be useful
    "Architecture rules are followed" is not actionable
    Reviewers don't know what to check
    Different change types need different concerns
```

### Rationale
A generic "check architecture" checkbox provides no guidance. Reviewers don't know what to look for. A new module needs different checks than a bug fix. Targeted checklists guide the reviewer to the right concerns for each change type. They also make expectations explicit — the PR author knows what they need to address before submitting. Limit each checklist to 5-10 items so reviewers can actually complete them without fatigue.

### Recommended Default
Change-type-specific checklists in PR templates (5-10 items each)

### Risks
- Generic checklist: too vague, no guidance, inconsistent review coverage
- Too many items: checklist fatigue, reviewers skip them
- No checklist at all: reviewers check different things, consistent concerns missed

### Related Rules
- Use Architecture Checklists Per Change Type In PR Templates (AEG-04/05-rules.md)
- Limit Checklist Items To High-Impact Concerns (AEG-04/05-rules.md)
- Include Security In The Review Checklist (AEG-04/05-rules.md)

### Related Skills
- Apply Code Review Guardrails for Architecture (AEG-04/06-skills.md)
- Document Team Conventions (AEG-07/06-skills.md)
- Create Onboarding Documentation (AEG-10/06-skills.md)
