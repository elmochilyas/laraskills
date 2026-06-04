# Decision Trees: Import Violation Detection

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Architecture Enforcement and Governance
- **Knowledge Unit:** Import violation detection
- **Knowledge Unit ID:** AEG-05
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Strict allowlist (empty by default) vs permissive allowlist | Architecture | Import allowance strategy |
| 2 | Direct-only detection vs transitive dependency detection | Architecture | Detection scope |
| 3 | Pest architecture tests vs custom scripts/dependency maps | Architecture | Detection mechanism |

---

## Decision 1: Strict allowlist (empty by default) vs permissive allowlist

### Context
When a bounded context is created, its import allowlist can start empty (strict: every import must be explicitly approved) or permissive (all imports allowed until blocked). Strict defaults prevent accidental coupling. Permissive defaults allow coupling to grow silently until it's expensive to untangle.

### Decision Tree

```
What is the default import state for a new bounded context?
├── Empty allowlist (strict)
│   → Recommended approach
│   Every import from another context must be explicitly approved
│   Initial state: no imports allowed except from Shared kernel
│   Adding a new dependency: deliberate decision, documented in tests
│   └── Is this a greenfield context with clear dependencies?
│       ├── YES → Still start empty — add known deps explicitly
│       └── NO → Even more reason to start empty — prevent unknown coupling
├── Full allowlist (permissive)
│   → Anti-pattern — unless explicitly justified
│   All imports allowed until explicitly blocked
│   Risk: developers import freely from any context
│   Six months later: implicit dependencies on 5+ contexts
│   └── When is permissive acceptable?
│       ├── Prototype (intentionally fluid architecture)
│       └── NEVER in production — always use strict allowlist
└── Hybrid (some allowed, some blocked)
    → Can work if clearly documented
    But: who decides which are blocked?
    Risk: imports from blocked contexts appear in code reviews
    Developer: "I didn't know that context was blocked"
```

### Rationale
Strict allowlists prevent accidental coupling. When a developer needs to import from a new context, they must make a deliberate decision — add the dependency to the allowlist and document it. This conscious process prevents the "just one quick import" that accumulates into tight coupling over months. Permissive defaults allow coupling to grow unnoticed because each individual import seems harmless. The shared kernel is the only universal allowlist because it contains only common, non-domain-specific code.

### Recommended Default
Strict (empty allowlist per context, add explicitly)

### Risks
- Permissive: accidental coupling accumulates silently
- Strict with no exception process: developers may bypass by using FQCNs
- Strict with no shared kernel: every common utility needs explicit cross-context import

### Related Rules
- Default To Strict Import Allowlists Per Context (AEG-05/05-rules.md)
- Shared Kernel As Only Universal Allowlist (AEG-05/05-rules.md)
- Use Pest Architecture Tests For Import Rules (AEG-05/05-rules.md)

### Related Skills
- Detect Import Violations Between Bounded Contexts (AEG-05/06-skills.md)
- Encode Rules as Architecture Tests (AEG-01/06-skills.md)
- Enforce Architecture Rules in CI (AEG-02/06-skills.md)

---

## Decision 2: Direct-only detection vs transitive dependency detection

### Decision Tree

```
What level of import detection is needed?
├── Direct imports only
│   → Simplest detection — check each context's direct `use` statements
│   Context A may not import from Context C (direct check)
│   Pros: simple to implement and understand
│   Cons: misses transitive dependencies
│   If A imports B and B imports C, A effectively depends on C
│   But no direct import from A to C exists — passes the check
│   └── Is the dependency graph shallow?
│       ├── YES (max 1 level deep) → Direct detection may be sufficient
│       └── NO (3+ levels of nesting) → Direct detection is NOT enough
├── Direct + transitive dependencies
│   → Recommended approach
│   Checks both: A → C (direct) and A → B → C (transitive)
│   Implementation:
│   ├── Pest test for each transitive path
│   └── Or: CI job that analyzes the full dependency graph
│   Pros: catches hidden coupling, true picture of dependencies
│   Cons: more complex detection, more tests to maintain
│   └── Are contexts deeply nested in the dependency graph?
│       ├── YES → Transitive detection is essential
│       │   Without it, the dependency graph is inaccurate
│       └── NO → Still recommended — shallow graphs can deepen
└── Is the shared kernel involved?
    → Exclude from transitive checks
    Shared kernel is universal — no transitive implications
```

### Rationale
Direct import detection alone is insufficient. If Context A imports from Context B, and Context B imports from Context C, Context A effectively depends on Context C — a change in C can break A even though A never directly imports from C. Transitive dependency detection catches this hidden coupling. The shared kernel is excluded from transitive checks because it's intentionally universal. Without transitive detection, the dependency map shows a cleaner picture than reality.

### Recommended Default
Detect both direct and transitive import violations

### Risks
- Direct-only: hidden coupling through dependency chain
- Transitive with no exceptions: shared kernel triggers false positives
- Transitive with too many exceptions: gaps in detection

### Related Rules
- Detect Transitive Dependencies (AEG-05/05-rules.md)
- Shared Kernel As Only Universal Allowlist (AEG-05/05-rules.md)
- Use Pest Architecture Tests For Import Rules (AEG-05/05-rules.md)

### Related Skills
- Detect Import Violations Between Bounded Contexts (AEG-05/06-skills.md)
- Encode Rules as Architecture Tests (AEG-01/06-skills.md)
- Implement Drift Detection (AEG-08/06-skills.md)

---

## Decision 3: Pest architecture tests vs custom scripts/dependency maps

### Decision Tree

```
How should the dependency map be encoded and enforced?
├── As Pest architecture tests
│   → Recommended approach
│   Each import rule is a Pest test:
│   `test('Checkout may not import from Inventory')`
│   Pros: executable, readable, auto-verified in CI
│   Pros: no additional tooling, no configuration files
│   Pros: exception list via `->ignoring()` is explicit
│   └── Is the context count small (< 10)?
│       ├── YES → Pest tests are perfectly manageable
│       └── NO → Still manageable — one test per forbidden import pair
├── As a configuration file (JSON, YAML dependency map)
│   → Alternative — adds maintenance overhead
│   `dependency-map.json` defines allowed imports
│   A custom script or PHPStan rule reads it and checks imports
│   Pros: central view of all import rules
│   Cons: additional tooling to maintain, synced with tests
│   Cons: need to ensure the config file is checked
│   └── Is there already a dependency map tooling in place?
│       ├── YES → May be acceptable to use existing tooling
│       └── NO → Choose Pest tests (simpler)
└── As documentation only (spreadsheet, wiki, diagram)
    → Anti-pattern — not enforced
    No automated checking
    Developers must manually verify imports against documentation
    Documentation inevitably becomes outdated
```

### Rationale
Pest architecture tests are the ideal mechanism for import rule enforcement. They are executable (run in CI, block merges), readable (self-documenting), and require no additional tooling. A test like `expect('App\Modules\Checkout')->not->toUse('App\Modules\Inventory')` is both the rule definition and the enforcement. Configuration files add an extra layer of tooling that must be maintained, synced, and debugged. Documentation-only is not enforcement at all.

### Recommended Default
Pest architecture tests — executable, readable, no additional tooling

### Risks
- Custom config file: maintenance overhead, must be synced with actual rules
- Documentation-only: not enforced, always out of date
- Pest tests for too many rules: many test files, but still manageable

### Related Rules
- Use Pest Architecture Tests For Import Rules (AEG-05/05-rules.md)
- Run Detection In CI As Pre-Merge Gate (AEG-05/05-rules.md)
- Maintain Documented Dependency Map (AEG-05/05-rules.md)

### Related Skills
- Detect Import Violations Between Bounded Contexts (AEG-05/06-skills.md)
- Encode Rules as Architecture Tests (AEG-01/06-skills.md)
- Enforce Architecture Rules in CI (AEG-02/06-skills.md)
